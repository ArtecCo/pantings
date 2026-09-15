const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
const localHost = hostname === "localhost" || hostname === "127.0.0.1";
const defaultApiBase = localHost ? "http://localhost/paintings/api" : "https://api.arts.araha.co.in";
const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || defaultApiBase).trim();

export const API_BASE_URL = configuredApiBase.replace(/\/$/, "");

export function apiUrl(path) {
  const normalizedPath = String(path || "").replace(/^\//, "");
  return `${API_BASE_URL}/${normalizedPath}`;
}
