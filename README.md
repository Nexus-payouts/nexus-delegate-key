# nexus-delegate-key

Code de référence de la **clé temporaire** de [Nexus](https://nexuspayouts.com), l'outil de distribution de
paiements SOL / USDC sur Solana. C'est exactement le code qu'exécute l'application : un test de Nexus
vérifie, à chaque modification, que ce fichier est identique au sien.

*English summary below.*

## À quoi sert la clé temporaire

Une distribution Nexus demande plusieurs transactions par lot de 20 destinataires. Pour ne pas vous faire
approuver chacune dans votre wallet, Nexus crée une **clé temporaire**, propre à la campagne, qui les signe
dans votre navigateur. Vous y envoyez les fonds de la distribution ; elle les remet aux programmes de
MultiHopper, puis vous rend le solde.

## Comment elle est calculée

1. Votre wallet signe un message fixe qui contient votre adresse, la référence de la campagne et le réseau
   (`delegateMessage` dans [`src/delegate-key.ts`](src/delegate-key.ts)).
2. **Graine** = SHA-256 de cette signature de 64 octets (`delegateSeed`).
3. **Clé** = paire ed25519 issue de cette graine (`Keypair.fromSeed(graine)` dans `@solana/web3.js`).

Conséquences :

- **Déterministe** : la signature ed25519 est déterministe (RFC 8032). Même wallet + même campagne donnent
  toujours la même clé. Elle n'est donc stockée nulle part, et peut être recréée plus tard.
- **Locale** : la signature et la clé ne quittent jamais votre navigateur. Le serveur de Nexus ne voit que
  l'adresse publique de la clé.
- **Une clé par campagne** : une autre référence de campagne donne une autre clé.

## Vérifier vous-même

Node.js ≥ 22.18, aucune dépendance :

```bash
npm test                                    # vecteur de référence + propriétés
node verify.ts --message <wallet> <référence> <devnet|mainnet-beta>
node verify.ts <wallet> <référence> <devnet|mainnet-beta> <signature base64>
```

La première commande `verify.ts` affiche le message à faire signer ; la seconde recalcule l'adresse de la clé,
qui doit être celle affichée par Nexus pour la campagne (« Clé déléguée »).

## Récupérer des fonds sans Nexus

Si Nexus n'était plus disponible, vous pourriez recréer la clé de vos campagnes et en retirer ce qui reste
(loyers rendus par MultiHopper, reliquats) avec n'importe quel outil Solana :

```js
import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { delegateMessageBytes, delegateSeed } from "./src/delegate-key.ts";

const signature = await wallet.signMessage(delegateMessageBytes(walletAddress, ref, "mainnet-beta"));
const key = Keypair.fromSeed(await delegateSeed(signature));
// Ensuite : transférer le solde de key.publicKey vers votre wallet (et fermer son compte USDC s'il existe).
```

## Risques résiduels

- **Hameçonnage** : le message ne contient pas l'adresse du site. Un faux site qui vous ferait signer
  exactement ce texte obtiendrait la clé, et pourrait prendre ce qu'elle détient à ce moment-là. Ne signez
  ce message que sur `nexuspayouts.com` (votre wallet affiche le site qui le demande). Les fonds ne restent
  sur la clé que le temps d'une distribution, plus de petits loyers rendus ensuite.
- **Navigateur compromis** : pendant une distribution, la clé est en mémoire dans la page. Une extension
  malveillante ou un poste infecté pourrait la lire.
- **Signature partagée** : quiconque obtient la signature peut recréer la clé. Ne la communiquez jamais.

## Licence

MIT, voir [LICENSE](LICENSE).

---

## English summary

Reference code for the Nexus **temporary key**, the per-campaign key that signs distribution transactions in
your browser so you don't approve each one in your wallet. It is the exact code the app runs (a Nexus test
checks this file is identical to its own).

**Derivation:** your wallet signs a fixed message (your address, the campaign reference, the network);
seed = SHA-256(64-byte signature); key = ed25519 keypair from that seed (`Keypair.fromSeed`). ed25519
signatures are deterministic, so the key is never stored and can be re-created later; it never leaves your
browser. Run `npm test` (Node ≥ 22.18, no dependencies) and `node verify.ts` to check it yourself.

**Residual risks:** the message does not contain the site's address, so a phishing site that gets you to sign
this exact text would obtain the key and whatever it holds at that moment; only sign it on `nexuspayouts.com`.
A compromised browser could read the key during a distribution. Never share the signature.
