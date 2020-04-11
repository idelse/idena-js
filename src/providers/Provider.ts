import Transaction from "../models/Transaction";

export default interface Provider {

    getAddress(): Promise<string>;
    sign(message: Buffer): Promise<Buffer>;
    inject(signedTransaction: Buffer): Promise<string>;
    getEpoch(): Promise<number>;
    getNonceByAddress(address: string): Promise<number>;
    getBalanceByAddress(address: string): Promise<{ balance: number, stake: number }>;
    getTransactionByHash(hash: string): Promise<Transaction>;
    getIdentityByAddress(address: string): Promise<Identity>;

}
