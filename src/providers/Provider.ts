import Transaction from "../models/Transaction";

export default interface Provider {

    getAddress(): Promise<string>;
    sign(message: Buffer): Promise<Buffer>;
    inject(signedTransaction: Buffer): Promise<string>;
    getEpoch(): Promise<number>;
    getNonceByAddress(address: string): Promise<number>;
    getTransactionByHash(hash: string): Promise<Transaction>;

}