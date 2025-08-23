// Storage cleanup utilities - no hardcoded keys

export function removeLocalStorageByPrefix(prefix: string): void {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      localStorage.removeItem(k);
    }
  }
}