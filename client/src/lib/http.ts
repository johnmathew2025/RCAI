export async function postJson<TBody extends object, TRes>(url: string, body: TBody): Promise<TRes> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw data;
  return data as TRes;
}