import assert from "node:assert/strict";
import { sign } from "node:crypto";
import { test } from "node:test";
import { delegateMessage, delegateMessageBytes, delegateSeed } from "../src/delegate-key.ts";
import { addressFromSeed, privateKeyFromSeed } from "../src/public-key.ts";

// Reference vector, identical to the one in the Nexus app. The message stays in French on purpose:
// it is the exact text wallets sign, and every key depends on it.
const VECTOR = {
  walletSeed: new Uint8Array(32).fill(7),
  wallet: "GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB",
  ref: "nx-vecteur-0001",
  cluster: "devnet",
  message:
    "Nexus — clé déléguée\n\nWallet : GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB\nCampagne : nx-vecteur-0001\nRéseau : devnet\n\n" +
    "Cette signature crée une clé temporaire qui signera cette distribution dans votre navigateur.\n" +
    "Ne signez ce message que sur l'application Nexus.",
  signature: "OhHTOEN4xYVnAcy/ryjE6g+x+YluObYO6hknadprdI18yRGMkvwf0oVRm3UULy5wfOxRqgIa7m1rPRu0zguHCQ==",
  seed: "843d535c7cc803649444da3418c7f65afdaf63b031d34d626ae7188bcfa1907c",
  delegate: "E4MCkeJTMo43U5vU15aL1dCdv9XEeEsPs5NvjLKJzHkp",
};

test("the message is exactly the one the wallet signs in Nexus", () => {
  assert.equal(delegateMessage(VECTOR.wallet, VECTOR.ref, VECTOR.cluster), VECTOR.message);
});

test("signature → seed → temporary key address", async () => {
  assert.equal(addressFromSeed(VECTOR.walletSeed), VECTOR.wallet);
  const signature = sign(null, Buffer.from(delegateMessageBytes(VECTOR.wallet, VECTOR.ref, VECTOR.cluster)), privateKeyFromSeed(VECTOR.walletSeed));
  assert.equal(signature.toString("base64"), VECTOR.signature);
  const seed = await delegateSeed(new Uint8Array(signature));
  assert.equal(Buffer.from(seed).toString("hex"), VECTOR.seed);
  assert.equal(addressFromSeed(seed), VECTOR.delegate);
});

test("same wallet and same campaign: same key; another campaign: another key", async () => {
  const key = privateKeyFromSeed(VECTOR.walletSeed);
  const derive = async (ref: string) =>
    addressFromSeed(await delegateSeed(new Uint8Array(sign(null, Buffer.from(delegateMessageBytes(VECTOR.wallet, ref, "devnet")), key))));
  assert.equal(await derive("nx-a"), await derive("nx-a"));
  assert.notEqual(await derive("nx-a"), await derive("nx-b"));
});

test("a signature of the wrong length is rejected", async () => {
  await assert.rejects(delegateSeed(new Uint8Array(32)));
});
