export function isLoopbackAddress(value: string | null): boolean {
  if (!value) return true;
  const address = value.split(",")[0].trim().replace(/^::ffff:/, "");
  return address === "127.0.0.1" || address === "::1" || address === "localhost";
}

export function canAccessRequest(headers: Headers, mode = process.env.APP_ACCESS_MODE ?? "local"): boolean {
  if (mode !== "local") return false;
  return isLoopbackAddress(headers.get("x-forwarded-for") ?? headers.get("x-real-ip"));
}
