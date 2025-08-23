export function removeByPrefix(storage: Storage, prefix: string) {
  const rm: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && k.startsWith(prefix)) rm.push(k);
  }
  rm.forEach((k) => storage.removeItem(k));
}

export function purgeAllDrafts(prefix: string) {
  try { removeByPrefix(window.localStorage, prefix); } catch {}
  try { removeByPrefix(window.sessionStorage, prefix); } catch {}
}

// Legacy function for compatibility
export function removeLocalStorageByPrefix(prefix: string) {
  removeByPrefix(window.localStorage, prefix);
}