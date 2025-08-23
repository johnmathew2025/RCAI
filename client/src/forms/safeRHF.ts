import { UseFormReturn } from "react-hook-form";

let WRITE_ALLOWED = true; // flipped off in create mode after reset

export function initWriteLock(allowed: boolean) {
  WRITE_ALLOWED = allowed;
}

export function withWriteLock<T>(fns: UseFormReturn<T>) {
  const { setValue, reset } = fns;
  return {
    ...fns,
    setValue: (...args: Parameters<typeof setValue>) => {
      if (!WRITE_ALLOWED) {
        console.error("❌ Illegal setValue after reset", { field: args[0] });
        throw new Error("Illegal form write in create mode");
      }
      // @ts-ignore
      return setValue(...args);
    },
    reset: (...args: Parameters<typeof reset>) => {
      // always allowed
      // @ts-ignore
      return reset(...args);
    },
  } as UseFormReturn<T>;
}