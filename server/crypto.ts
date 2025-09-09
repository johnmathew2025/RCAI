// REPLACED: This file is now replaced by server/security/crypto.ts
// This file remains for backwards compatibility but will redirect to the new crypto system
export { encrypt, decrypt } from './security/crypto';

export const mask = (s: string) => s.length <= 6 ? '•••' : s.slice(0,3) + '••••' + s.slice(-3);