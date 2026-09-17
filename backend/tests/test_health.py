"""Smoke test placeholder — arranca el guardrail de cobertura del pipeline.

IMPORTANTE (Directiva 4 del mandato DevSecOps): el gate de CI exige >=90% de
cobertura. Con solo este test la cobertura real es mucho menor que 90% y el
job `test` en ci.yml FALLARÁ intencionalmente (Fail Fast) hasta que el equipo
de desarrollo agregue la suite de tests real para app/api, app/services,
app/repositories, etc. Esto es deliberado: no se debe bajar el umbral para
maquillar el gate, se debe escribir la suite.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
