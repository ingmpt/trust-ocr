const ARCO_SESSION_KEY = "trustocr_arco_session";

interface ArcoSession {
  dni: string;
  validation_token: string;
}

export function saveArcoSession(session: ArcoSession): void {
  sessionStorage.setItem(ARCO_SESSION_KEY, JSON.stringify(session));
}

export function getArcoSession(): ArcoSession | null {
  const raw = sessionStorage.getItem(ARCO_SESSION_KEY);
  return raw ? (JSON.parse(raw) as ArcoSession) : null;
}
