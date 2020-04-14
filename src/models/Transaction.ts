import Provider from "../providers/Provider";
import Operation from "./Operation";
const RLP = require("rlp");

export interface TransactionParameters {
    nonce?: number;
    epoch?: number;
    type?: number;
    from?: string;
    blockHash?: string;
    to: string;
    amount: number;
    maxFee?: number;
    tips?: number;
    payload?: string | Buffer;
    signature?: string | Buffer;
    hash?: string;
    usedFee?: number;
    timestamp?: Date;
}

export default class Transaction implements TransactionParameters {
    
    private provider: Provider;

    nonce?: number;
    epoch?: number;
    type?: number;
    from?: string;
    blockHash?: string;
    to: string;
    amount: number;
    maxFee?: number;
    tips?: number;
    payload?: string | Buffer;
    signature?: string | Buffer;
    hash?: string;
    usedFee?: number;
    timestamp?: Date;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    async inject(): Promise<Operation> {
        const forged = await this.getForged();
        const signature = await this.provider.sign(forged);
        const signedTransaction = await this.getForged(signature);
        this.hash = await this.provider.inject(signedTransaction);
        return new Operation(this.provider, this.hash);
    }

    async getForged(signature?: Buffer): Promise<Buffer> {
        if (this.nonce === undefined) {
            const address = await this.provider.getAddress();
            this.nonce = (await this.provider.getNonceByAddress(address)) + 1;
        }
        if (this.epoch === undefined) {
            this.epoch = await this.provider.getEpoch();
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

    static deserialize(provider: Provider, data: TransactionParameters): Transaction {
        return Object.assign(new Transaction(provider), data);
    }

}