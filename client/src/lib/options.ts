/**
 * Options sanitization utility - prevents empty values in Select components
 * UNIVERSAL PROTOCOL STANDARD: No hardcoding, dynamic filtering
 */

export type Opt = { id: string | number; name: string };

/** Remove null/empty values and force string IDs */
export function sanitizeOptions(list: unknown): { id: string; name: string }[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((o): o is Opt => !!o && (o as any).id != null && (o as any).name != null)
    .map(o => ({ id: String(o.id).trim(), name: String(o.name).trim() }))
    .filter(o => o.id !== "" && o.name !== "");
}

/** Add a dev-time assert (helps catch regressions) */
export function assertNoEmptyOption(name: string, opts: {id:string;name:string}[]) {
  const bad = opts.find(o => !o.id || o.id === "" || !o.name || o.name === "");
  if (bad) console.error(`[${name}] has empty option`, bad, opts);
}