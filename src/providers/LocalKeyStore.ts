import Provider from "./Provider";
import request from "request-promise";
import Transaction from "../models/Transaction";
import Identity from "../models/Identity";
import * as secp256k1 from "noble-secp256k1";
import { keccak256 } from "@ethersproject/keccak256";

export = class LocalKeyStore implements Provider {

    private readonly privateKey: string;
    private rpc: string;

    constructor(privateKey?: string, rpc: string = "https://rpc.idena.dev") {
        if (privateKey === undefined)
            this.privateKey = secp256k1.utils.randomPrivateKey().toString();
        this.privateKey = this.remove0x(privateKey);
        this.rpc = rpc;
    }

    async sign(message: Buffer): Promise<Buffer> {
        const digest = this.remove0x(keccak256(message));
        let sig = await secp256k1.sign(digest, this.privateKey);
        sig = this.remove0x(keccak256(Buffer.from(sig, "hex")));
        console.log("sig >> ", sig);
        const r = sig.slice(0, 32);
        const s = sig.slice(32, 64);
        let v = parseInt(sig[63]);
        if (v !== 27 && v !== 28) {
            v = 27 + (v % 2);
        }
        const recoveryParam = (v - 27);
        console.log([
            Buffer.from(r, "hex"),
            Buffer.from(s, "hex"),
            Buffer.from([recoveryParam]),
        ]);
        return Buffer.concat([
            Buffer.from(r, "hex"),
            Buffer.from(s, "hex"),
            Buffer.from([recoveryParam]),
        ]);
    }

    inject(signedMessage: Buffer): Promise<string> {
        const hexSignedMessage = "0x"+signedMessage.toString("hex");
        return this.request("bcn_sendRawTx", [hexSignedMessage]);
    }

    getAddress(): Promise<string> {
        const publicKey = secp256k1.getPublicKey(this.privateKey);
        const publicKeyWithou04Prefix = Buffer.from(publicKey.substr(2), "hex");
        const address = "0x"+keccak256(publicKeyWithou04Prefix).substr(26);
        return Promise.resolve(address);
    }

    async getEpoch(): Promise<number> {
        const result = await this.request("dna_epoch");
        return result.epoch;
    }

    async getNonceByAddress(address: string): Promise<number> {
        const { nonce } = await this.request("dna_getBalance", [address]);
        return nonce;
    }

    async getBalanceByAddress(address: string): Promise<{ balance: number, stake: number }> {
        const { balance, stake } = await this.request("dna_getBalance", [address]);
        return { balance, stake };
    }

    async getTransactionByHash(hash: string): Promise<Transaction> {
        let result = await this.request("bcn_transaction", [hash]);
        return Transaction.deserialize(this, {
            hash: result.hash,
            nonce: result.nonce,
            type: result.type === "send" ? 0 : -1,
            to: result.to,
            from: result.from,
            amount: result.amount,
            epoch: result.epoch,
            payload: result.payload,
            blockHash: result.blockHash,
            usedFee: result.usedFee,
            timestamp: new Date(result.timestamp*1000),            
        });
    }

    async getIdentityByAddress(address: string): Promise<Identity> {
        let identity: any = this.request("dna_identity", [address]);
        identity.penalty = parseFloat(identity.penalty);
        return identity;
    }

    private request(method: string, params: any[] = []) {
        return request({
            url: this.rpc,
            json: {
                id: 1,
                method,
                params
            },
            method: "POST",
            headers: {
                "content-type": "application/json",
            }
        }).then(r => {
            if (!r) {
                throw Error(`${method} could be blacklisted`)
            }
            if (r && r.error && r.error.message)
                throw Error(r.error.message);
            if (!r.result)
                throw Error("unknown error");
            return r.result;
        });
    }

    private remove0x(msg: string): string {
        if (msg.slice(0, 2) === "0x")
            return msg.substr(2);
        return msg;
    }

}
