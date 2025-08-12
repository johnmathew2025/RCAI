/**
 * Array normalization utility - prevents .map() errors
 * Ensures all API responses are treated as arrays
 */

export function asArray<T = unknown>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x == null) return [];
  
  // If API accidentally returns an object like {data: [...]}
  // extract a single array field if present:
  if (typeof x === 'object') {
    const v = Object.values(x as Record<string, unknown>).find(Array.isArray);
    if (Array.isArray(v)) return v as T[];
  }
  
  return [];
}

/**
 * Runtime assertion helper for debugging array issues
 */
export function assertArray(name: string, v: unknown): void {
  if (!Array.isArray(v)) {
    console.error(`[AddEvidence] ${name} not array`, v);
  }
}