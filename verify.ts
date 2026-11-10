/**
 * Re-computes the address of a campaign's temporary key from the wallet's signature.
 *
 *   node verify.ts <wallet> <campaign reference> <devnet|mainnet-beta> <base64 signature>
 *
 * To get the signature, have your wallet sign the message printed by
 *   node verify.ts --message <wallet> <reference> <network>
 * The resulting address must be the one Nexus shows for the campaign ("Delegate key").
 * Warning: anyone holding this signature can re-create the key. Never share it.
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
  console.error(
    "Usage:\n  node verify.ts --message <wallet> <reference> <devnet|mainnet-beta>\n  node verify.ts <wallet> <reference> <devnet|mainnet-beta> <base64 signature>",
  );
  process.exit(2);
}
