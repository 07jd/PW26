export async function getNewTokenIfExpired() {
  const response_session = await fetch("/user/session", {
    method: "GET",
    credentials: "include",
  });

  if (response_session.ok) return;
  if (response_session.status === 401) {
    const response_refresh = await fetch("/user/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (response_refresh.ok) return;
  }
  throw new Error("invalid session or offline");
}
