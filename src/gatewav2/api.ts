const API = import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).replace(/\/$/, "")
  : import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://ticketing-back.onrender.com";

export async function gw<T>(path: string, init?: RequestInit): Promise<T> {
  let token = "";
  try {
    token = JSON.parse(localStorage.getItem("gatewav_auth") || "{}").token || localStorage.getItem("adminToken") || "";
  } catch {
    token = "";
  }
  const headers: Record<string, string> = { Accept: "application/json", ...(init?.headers as Record<string, string>) };
  if (init?.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
  return data as T;
}

export function track(name: string, extra?: Record<string, unknown>) {
  const anonId = localStorage.getItem("gatewav.anonId") || `a_${Date.now().toString(36)}`;
  localStorage.setItem("gatewav.anonId", anonId);
  void gw("/api/gatewav2/analytics", {
    method: "POST",
    body: JSON.stringify({ name, anonId, ...extra }),
  }).catch(() => undefined);
}

export function whatsappShare(title: string, url: string) {
  const text = encodeURIComponent(`${title}\n${url}\nGet tickets on the web or in the GateWav app.`);
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
}
