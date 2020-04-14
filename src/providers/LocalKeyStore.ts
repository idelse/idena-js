import Provider from "./Provider";
import request from "request-promise";
import { SigningKey, keccak256 } from "ethers/utils"
import { Wallet } from "ethers"
import Transaction from "../models/Transaction";
import Identity from "../models/Identity";

export = class LocalKeyStore implements Provider {

    private signingKey: SigningKey;
    private rpc: string;

    constructor(privateKey?: string, rpc: string = "https://rpc.idena.dev") {
        if (privateKey === undefined)
            privateKey = Wallet.createRandom().privateKey;
        this.signingKey = new SigningKey(privateKey);
        this.rpc = rpc;
    }

    async sign(message: Buffer): Promise<Buffer> {
        const digest = keccak256(message);
        const sig = this.signingKey.signDigest(digest);
        return Buffer.concat([
            Buffer.from(sig.r.substr(2), "hex"),
            Buffer.from(sig.s.substr(2), "hex"),
            Buffer.from([sig.recoveryParam]),
        ]);
    }

    inject(signedMessage: Buffer): Promise<string> {
        const hexSignedMessage = "0x"+signedMessage.toString("hex");
        return this.request("bcn_sendRawTx", [hexSignedMessage]);
    }

    getAddress(): Promise<string> {
        return Promise.resolve(this.signingKey.address);
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

}
