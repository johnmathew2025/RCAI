import fs from "fs";

export function loadCryptoKey(): string {
  const env = process.env.CRYPTO_KEY_32;
  if (env && env.length === 32) return env;

  const file = process.env.CRYPTO_KEY_FILE;
  if (file && fs.existsSync(file)) {
    const k = fs.readFileSync(file, "utf8").trim();
    if (k.length === 32) return k;
  }
  throw new Error(
    "Missing or invalid CRYPTO_KEY_32. Admin must set a 32-char key via env/secret."
  );
}