import assert from "node:assert/strict";
import { sign } from "node:crypto";
import { test } from "node:test";
import { delegateMessage, delegateMessageBytes, delegateSeed } from "../src/delegate-key.ts";
import { addressFromSeed, privateKeyFromSeed } from "../src/public-key.ts";

// Vecteur de référence, identique à celui de l'application Nexus.
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

test("le message est exactement celui que signe le wallet dans Nexus", () => {
  assert.equal(delegateMessage(VECTOR.wallet, VECTOR.ref, VECTOR.cluster), VECTOR.message);
});

test("signature → graine → adresse de la clé temporaire", async () => {
  assert.equal(addressFromSeed(VECTOR.walletSeed), VECTOR.wallet);
  const signature = sign(null, Buffer.from(delegateMessageBytes(VECTOR.wallet, VECTOR.ref, VECTOR.cluster)), privateKeyFromSeed(VECTOR.walletSeed));
  assert.equal(signature.toString("base64"), VECTOR.signature);
  const seed = await delegateSeed(new Uint8Array(signature));
  assert.equal(Buffer.from(seed).toString("hex"), VECTOR.seed);
  assert.equal(addressFromSeed(seed), VECTOR.delegate);
});

test("même wallet et même campagne : même clé ; autre campagne : autre clé", async () => {
  const key = privateKeyFromSeed(VECTOR.walletSeed);
  const derive = async (ref: string) =>
    addressFromSeed(await delegateSeed(new Uint8Array(sign(null, Buffer.from(delegateMessageBytes(VECTOR.wallet, ref, "devnet")), key))));
  assert.equal(await derive("nx-a"), await derive("nx-a"));
  assert.notEqual(await derive("nx-a"), await derive("nx-b"));
});

test("une signature de mauvaise taille est refusée", async () => {
  await assert.rejects(delegateSeed(new Uint8Array(32)));
});
