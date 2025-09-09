export const guardValue = (v: unknown) => {
  if (v === "") {
    // eslint-disable-next-line no-console
    console.error("EMPTY STRING passed to Select/RadioGroup value");
    return undefined;
  }
  return v as string | undefined;
};

export const safeSelectValue = (v: string | null | undefined) =>
  v && v.trim().length > 0 ? v : undefined;