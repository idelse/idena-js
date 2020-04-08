import Provider from "./providers/Provider";
const RLP = require("rlp");

export interface TransactionParameters {
    nonce?: number;
    epoch?: number;
    type?: number;
    to: string;
    amount: number;
    maxFee?: number;
    tips?: number;
    payload?: string | Buffer;
    signature?: string | Buffer;
    hash?: string;
}

export class Transaction implements TransactionParameters {
    
    nonce?: number;
    epoch?: number;
    type?: number;
    to: string;
    amount: number;
    maxFee?: number;
    tips?: number;
    payload?: string | Buffer;
    signature?: string | Buffer;
    hash?: string;

    async inject(provider: Provider): Promise<Transaction> {
        const forged = await this.getForged(provider);
        const signature = await provider.sign(forged);
        const signedTransaction = await this.getForged(provider, signature);
        this.hash = await provider.inject(signedTransaction);
        return this;
    }

    confirmation(): Promise<string> {
        return Promise.resolve(this.hash);
    }

    async getForged(provider: Provider, signature?: Buffer): Promise<Buffer> {
        if (this.nonce === undefined) {
            const address = await provider.getAddress();
            this.nonce = (await provider.getNonceByAddress(address)) + 1;
        }
        if (this.epoch === undefined) {
            this.epoch = await provider.getEpoch();
        }
        if (this.payload !== undefined && this.payload instanceof Buffer)
            this.payload = "0x"+Buffer.from(this.payload).toString("hex");
        if (this.signature !== undefined && this.signature instanceof Buffer)
            this.signature = "0x"+Buffer.from(this.signature).toString("hex");
        const data = [
            this.nonce,
            this.epoch,
            this.type || 0,
            this.to,
            this.amount*10**18,
            (this.maxFee || 0.00000000000003)*10**18,
            (this.tips || 0)*10**18,
            this.payload || "0x",
            signature || this.signature,
        ].filter(v => v !== undefined);
        return RLP.encode(data);
    }

    static deserialize(data: TransactionParameters): Transaction {
        return Object.assign(new Transaction(), data);
    }

    serialize(): TransactionParameters {
        return { ...this };
    }

}