/**
 * Outils Node pour vérifier une clé temporaire sans aucune dépendance : adresse Solana (base58) de la
 * paire ed25519 issue d'une graine. Équivaut à Keypair.fromSeed(seed).publicKey.toBase58() de
 * @solana/web3.js.
 */
import { createPrivateKey, createPublicKey } from "node:crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Encodage base58 (alphabet Bitcoin, celui des adresses Solana). */
export function base58(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);
  let out = "";
  while (value > 0n) {
    out = ALPHABET[Number(value % 58n)] + out;
    value /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    out = "1" + out;
  }
  return out;
}

/** Clé privée ed25519 (format Node) à partir d'une graine de 32 octets. */
export function privateKeyFromSeed(seed: Uint8Array) {
  if (seed.length !== 32) throw new Error("Une graine ed25519 fait 32 octets");
  const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed)]);
  return createPrivateKey({ key: der, format: "der", type: "pkcs8" });
}

/** Adresse Solana de la paire ed25519 issue de `seed`. */
export function addressFromSeed(seed: Uint8Array): string {
  const jwk = createPublicKey(privateKeyFromSeed(seed)).export({ format: "jwk" });
  return base58(Buffer.from(String(jwk.x), "base64url"));
}
