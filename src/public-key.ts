/**
 * Dependency-free Node helpers to check a temporary key: the Solana address (base58) of the ed25519 key
 * pair generated from a seed. Equivalent to Keypair.fromSeed(seed).publicKey.toBase58() in
 * @solana/web3.js.
 */
import { createPrivateKey, createPublicKey } from "node:crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Base58 encoding (Bitcoin alphabet, the one used by Solana addresses). */
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

/** ed25519 private key (Node format) from a 32-byte seed. */
export function privateKeyFromSeed(seed: Uint8Array) {
  if (seed.length !== 32) throw new Error("An ed25519 seed is 32 bytes long");
  const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed)]);
  return createPrivateKey({ key: der, format: "der", type: "pkcs8" });
}

/** Solana address of the ed25519 key pair generated from `seed`. */
export function addressFromSeed(seed: Uint8Array): string {
  const jwk = createPublicKey(privateKeyFromSeed(seed)).export({ format: "jwk" });
  return base58(Buffer.from(String(jwk.x), "base64url"));
}
