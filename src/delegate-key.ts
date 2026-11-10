/**
 * Dérivation de la clé temporaire (« clé déléguée ») de Nexus — code publié en open source.
 *
 * Principe : le wallet de l'utilisateur signe un message fixe, propre à une campagne. La clé temporaire
 * est tirée de cette signature : graine = SHA-256(signature), puis paire de clés ed25519 issue de cette
 * graine (Keypair.fromSeed de @solana/web3.js, ou toute bibliothèque ed25519 standard).
 *
 *  - La signature ed25519 est déterministe (RFC 8032) : même wallet + même message = même signature,
 *    donc même clé. Elle peut être recréée plus tard, sans être stockée nulle part.
 *  - La clé n'est calculée que dans le navigateur ; ni la signature ni la clé ne sont envoyées au serveur.
 *
 * Ce fichier n'a aucune dépendance (Web Crypto seulement) et n'utilise que des types TypeScript
 * effaçables : il s'exécute tel quel dans le navigateur, dans Node ≥ 22.18 et dans Deno.
 *
 * NE PAS MODIFIER le texte du message (ni le traduire) : la clé de chaque campagne en dépend. Le
 * changer empêcherait de recréer les clés des campagnes passées, et donc d'en récupérer les fonds restants.
 */

/** Message signé par le wallet pour une campagne. `cluster` : "devnet" ou "mainnet-beta". */
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

/** Octets UTF-8 du message, tels que le wallet les signe. */
export function delegateMessageBytes(wallet: string, ref: string, cluster: string): Uint8Array {
  return new TextEncoder().encode(delegateMessage(wallet, ref, cluster));
}

/** Graine de la clé temporaire : SHA-256 de la signature (64 octets) du message par le wallet. */
export async function delegateSeed(signature: Uint8Array): Promise<Uint8Array> {
  if (signature.length !== 64) throw new Error("Une signature ed25519 fait 64 octets");
  return new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", signature as BufferSource));
}
