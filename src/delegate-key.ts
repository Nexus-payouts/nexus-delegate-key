/**
 * Derivation of the Nexus temporary key ("delegate key") — published as open source:
 * https://github.com/Nexus-payouts/nexus-delegate-key
 *
 * Principle: the user's wallet signs a fixed, per-campaign message. The temporary key is derived from that
 * signature: seed = SHA-256(signature), then the ed25519 key pair generated from that seed
 * (Keypair.fromSeed in @solana/web3.js, or any standard ed25519 library).
 *
 *  - ed25519 signatures are deterministic (RFC 8032): same wallet + same message = same signature, hence
 *    the same key. It can be re-created later without ever being stored.
 *  - The key is only computed in the browser; neither the signature nor the key is sent to the server.
 *
 * This file has no dependencies (Web Crypto only) and only uses erasable TypeScript syntax: it runs as-is
 * in the browser, in Node ≥ 22.18 and in Deno.
 *
 * DO NOT CHANGE the text of the message (and do not translate it): every campaign's key depends on it.
 * Changing it would make the keys of past campaigns impossible to re-create, and their leftover funds
 * impossible to recover.
 */

/** Message signed by the wallet for a campaign. `cluster`: "devnet" or "mainnet-beta". */
export function delegateMessage(wallet: string, ref: string, cluster: string): string {
  return [
    "Nexus — clé déléguée",
    "",
    `Wallet : ${wallet}`,
    `Campagne : ${ref}`,
    `Réseau : ${cluster}`,
    "",
    "Cette signature crée une clé temporaire qui signera cette distribution dans votre navigateur.",
    "Ne signez ce message que sur l'application Nexus.",
  ].join("\n");
}

/** UTF-8 bytes of the message, as the wallet signs them. */
export function delegateMessageBytes(wallet: string, ref: string, cluster: string): Uint8Array {
  return new TextEncoder().encode(delegateMessage(wallet, ref, cluster));
}

/** Seed of the temporary key: SHA-256 of the wallet's signature (64 bytes) of the message. */
export async function delegateSeed(signature: Uint8Array): Promise<Uint8Array> {
  if (signature.length !== 64) throw new Error("An ed25519 signature is 64 bytes long");
  return new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", signature as BufferSource));
}
