/**
 * Safe Select Value Helper - Prevents empty string crashes
 * Converts empty/null/undefined values to undefined for Select components
 */
export const safeSelectValue = (v: string | null | undefined): string | undefined => {
  return v && v.trim().length > 0 ? v : undefined;
};