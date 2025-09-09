import crypto from "crypto";
import { loadCryptoKey } from "../config/crypto-key";

const ALG = "aes-256-gcm";
const KEY = Buffer.from(loadCryptoKey(), "utf8");

export const encrypt = (s: string) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv(ALG, KEY, iv);
  const ct = Buffer.concat([c.update(s, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
};

export const decrypt = (b64: string) => {
  const raw = Buffer.from(b64, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const d = crypto.createDecipheriv(ALG, KEY, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
};