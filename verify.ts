/**
 * Recalcule l'adresse de la clé temporaire d'une campagne à partir de la signature du wallet.
 *
 *   node verify.ts <wallet> <référence de campagne> <devnet|mainnet-beta> <signature en base64>
 *
 * La signature s'obtient en faisant signer par votre wallet le message affiché par
 *   node verify.ts --message <wallet> <référence> <réseau>
 * L'adresse obtenue doit être celle indiquée par Nexus pour la campagne (« Clé déléguée »).
 * Attention : quiconque détient cette signature peut recréer la clé. Ne la partagez avec personne.
 */
import { delegateMessage, delegateSeed } from "./src/delegate-key.ts";
import { addressFromSeed } from "./src/public-key.ts";

const args = process.argv.slice(2);
if (args[0] === "--message" && args.length === 4) {
  console.log(delegateMessage(args[1]!, args[2]!, args[3]!));
} else if (args.length === 4) {
  const signature = new Uint8Array(Buffer.from(args[3]!, "base64"));
  const seed = await delegateSeed(signature);
  console.log(addressFromSeed(seed));
} else {
  console.error("Usage :\n  node verify.ts --message <wallet> <référence> <devnet|mainnet-beta>\n  node verify.ts <wallet> <référence> <devnet|mainnet-beta> <signature base64>");
  process.exit(2);
}
