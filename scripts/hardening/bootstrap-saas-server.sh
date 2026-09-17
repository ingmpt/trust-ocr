#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Hardening + bootstrap para Server 1 de Hetzner ("SaaS Layer": Trust OCR hoy,
# Trust Vault / Trust Stamp a futuro). VPS/nodo recién creado, sin nada
# instalado. Servidor con IP pública PROPIA, distinta del Server 2 (apps de
# usuario final: ERP, trust-building-manager, BPM Híbrido).
#
# EJECUTAR MANUALMENTE, UNA SOLA VEZ, como root, vía consola/SSH directo:
#   scp scripts/hardening/bootstrap-saas-server.sh root@<IP_SERVER1>:/root/
#   ssh root@<IP_SERVER1> 'bash /root/bootstrap-saas-server.sh "ssh-ed25519 AAAA... tu-llave"'
#
# Zero Trust: crea un usuario "deploy" sin password (solo llave SSH);
# deshabilita login root y password auth. A diferencia del nodo de Infisical
# (harden-infisical-node.sh), este servidor SÍ expone 80/443 a Internet: es
# un SaaS público real, consumido por API Key + plan contratado a nivel de
# aplicación (no por restricción de IP de firewall).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_USER="deploy"
DEPLOY_SSH_PUBKEY="${1:?Uso: bootstrap-saas-server.sh \"ssh-ed25519 AAAA... tu-llave-publica\"}"
APP_DIR="/opt/trust-ocr"

echo "==> Actualizando sistema"
apt-get update -y && apt-get upgrade -y

echo "==> Creando usuario de despliegue sin password"
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
fi
mkdir -p "/home/$DEPLOY_USER/.ssh"
echo "$DEPLOY_SSH_PUBKEY" > "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 700 "/home/$DEPLOY_USER/.ssh"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"

echo "==> Instalando Docker Engine + Compose plugin"
curl -fsSL https://get.docker.com | sh
usermod -aG docker "$DEPLOY_USER"

echo "==> Instalando UFW + fail2ban"
apt-get install -y ufw fail2ban
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
# 80/443 abiertos a TODO Internet a propósito: este es el nodo SaaS público
# (Trust OCR/Vault/Stamp), no un servicio interno — el control de acceso real
# es API Key + plan contratado a nivel de aplicación (ver Trust OCR: JWT +
# API_KEY_PREFIX=tocr_ ya existente).
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban

echo "==> Hardening SSH (solo llaves, sin root remoto)"
SSHD=/etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSHD"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD"
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSHD"
systemctl restart sshd

echo "==> Creando red Docker externa para Traefik"
docker network create traefik-public || true

echo "==> Preparando directorio de despliegue"
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

cat <<'EOF'

==> Hecho. Pasos manuales pendientes (fuera del alcance de este script):
  1. Clona el repo en /opt/trust-ocr (flujo manual, sin CI/CD a GHCR):
     su - deploy -c 'git clone <URL_DEL_REPO> /opt/trust-ocr'
     (despliegues siguientes: cd /opt/trust-ocr && git pull)
  2. Crea /opt/trust-ocr/.env a partir de .env.example (permisos 600, owner
     deploy) con las credenciales REALES de Machine Identity de Infisical.
  3. Traefik: este nodo ya tiene Traefik gestionando otras apps — confirma que
     la red externa que usa se llama `traefik-public` (o ajusta las labels de
     docker-compose.prod.yml al nombre real). No hace falta infra/traefik-prod/
     si ya hay una instancia corriendo.
  4. DNS: crea el registro A de trustedtechnologyperu.com (ocr, app) apuntando
     a la IP pública de este servidor — esto se hace en el panel del
     registrador/DNS, no desde este script.
  5. Verifica que ya NO puedes hacer login como root por password:
     probar `ssh root@<IP>` debe fallar; `ssh deploy@<IP>` con tu llave debe
     funcionar. Hazlo ANTES de cerrar esta sesión SSH inicial.
  6. Primer arranque: cd /opt/trust-ocr &&
     docker compose -f docker-compose.prod.yml up -d --build
     seguido de: docker compose -f docker-compose.prod.yml exec -T api alembic upgrade head
EOF
