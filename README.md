# nexus-delegate-key

Reference code for the **temporary key** of [Nexus](https://nexuspayouts.com), the tool that distributes
SOL / USDC payments on Solana. This is exactly the code the app runs: a Nexus test checks, at every change,
that this file is identical to its own.

## What the temporary key is for

A Nexus distribution needs several transactions per batch of 20 recipients, and they expire in under a
minute. Rather than having you approve each of them in your wallet, Nexus creates a **temporary key**, specific
to the campaign, that signs them in your browser. You send it the funds of the distribution in a single
transfer; it hands them to MultiHopper's programs, then gives you back what is left.

## How it is computed

1. Your wallet signs a fixed message containing your address, the campaign reference and the network
   (`delegateMessage` in [`src/delegate-key.ts`](src/delegate-key.ts)).
2. **Seed** = SHA-256 of that 64-byte signature (`delegateSeed`).
3. **Key** = the ed25519 key pair generated from that seed (`Keypair.fromSeed(seed)` in `@solana/web3.js`).

Consequences:

- **Deterministic**: ed25519 signatures are deterministic (RFC 8032). The same wallet and the same campaign
  always give the same key. It is therefore never stored, and can be re-created later.
- **Local**: the signature and the key never leave your browser. The Nexus server only sees the key's public
  address.
- **One key per campaign**: another campaign reference gives another key.

The signed message is in French on purpose and must never be translated or changed: every key depends on its
exact text, and changing it would make past campaigns' keys impossible to re-create.

## Check it yourself

Node.js ≥ 22.18, no dependencies:

```bash
npm test                                    # reference vector + properties
node verify.ts --message <wallet> <reference> <devnet|mainnet-beta>
node verify.ts <wallet> <reference> <devnet|mainnet-beta> <base64 signature>
```

The first `verify.ts` command prints the message to sign; the second re-computes the key's address, which must
match the one Nexus shows for the campaign ("Delegate key").

## Recovering funds without Nexus

If Nexus were no longer available, you could re-create the key of your campaigns and withdraw what is left on
them (rent returned by MultiHopper, leftovers) with any Solana tool:

```js
import { Keypair } from "@solana/web3.js";
import { delegateMessageBytes, delegateSeed } from "./src/delegate-key.ts";

const signature = await wallet.signMessage(delegateMessageBytes(walletAddress, ref, "mainnet-beta"));
const key = Keypair.fromSeed(await delegateSeed(signature));
// Then: transfer key.publicKey's balance to your wallet (and close its USDC account if it has one).
```

## Residual risks

- **Phishing**: the message does not contain the site's address. A fake site that got you to sign this exact
  text would obtain the key, and could take whatever it holds at that moment. Only sign this message on
  `nexuspayouts.com` (your wallet shows which site is asking). Funds only stay on the key for the duration of
  a distribution, plus small rent returned afterwards.
- **Compromised browser**: during a distribution, the key is in the page's memory. A malicious extension or an
  infected computer could read it.
- **Shared signature**: anyone who obtains the signature can re-create the key. Never share it.

## License

MIT, see [LICENSE](LICENSE).
