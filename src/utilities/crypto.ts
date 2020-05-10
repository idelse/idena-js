import {Keccak} from "sha3";
import * as secp256k1 from "noble-secp256k1";

const createKeccakHash = new Keccak(256);

export function remove0x(msg: string): string {
    if (msg.slice(0, 2) === "0x")
        return msg.substr(2);
    return msg;
}

export function keccak256(msg: string | Buffer): string {
    if (typeof msg === "string")
        msg = remove0x(msg);
    if (msg instanceof Buffer)
        msg = msg.toString("hex");
    return "0x"+createKeccakHash.update(msg).digest().toString("hex");
}

export function generatePrivateKey() {
    return secp256k1.utils.randomPrivateKey().toString();
}

export function getPublicByPrivateKey(privateKey: string) {
    const publicKey = secp256k1.getPublicKey(privateKey).toString();
    return publicKey.substr(2);
}

export function getAddressByPublicKey(publicKey: string) {
    console.log({ publicKey });
    return "0x"+keccak256(publicKey).substr(26);
}

export async function secp256k1Sign(digest: string, privateKey: string) {
    console.log("digest >> ", digest)
    let sig = await secp256k1.sign(digest, privateKey, { canonical: true });
    const r = sig.slice(8, 72);
    const s = sig.slice(76, 140);
    const recoveryParam = 0;
    console.log(digest);
    console.log([
        r,
        s,
        [recoveryParam],
    ]);
    return Buffer.concat([
        Buffer.from(r, "hex"),
        Buffer.from(s, "hex"),
        Buffer.from([recoveryParam]),
    ]);
}