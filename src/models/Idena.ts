import Provider from "../providers/Provider";
import Transaction, { TransactionParameters } from "./Transaction";
import Operation from "./Operation";
import Identity from "./Identity";

export default class Idena {

    public provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    async transfer(parameters: TransactionParameters): Promise<Operation> {
        return Transaction.deserialize(this.provider, parameters).inject();
    }

    async bulkTransactions(transactions: TransactionParameters[]): Promise<Operation[]> {
        const address = await this.provider.getAddress();
        const nonce = await this.provider.getNonceByAddress(address);
        let ops: Operation[] = [];
        for (let i = 0; i < transactions.length; ++i) {
            ops = [
                ...ops,
                await this.transfer({
                    ...transactions[i],
                    nonce: nonce + i + 1
                })
            ];
        }
        return ops;
    }

    async getTransactionByOperation(op: string | Operation): Promise<Transaction> {
        let hash;
        if (op instanceof Operation)
            hash = op.hash;
        else if (typeof op === "string")
            hash = op;
        else
            throw Error("Operation must be string or Operation type.");
        return this.provider.getTransactionByHash(hash);
    }

    async getBalanceByAddress(address: string): Promise<{ balance: number, stake: number }> {
        return this.provider.getBalanceByAddress(address);
    }

    async getIdentityByAddress(address: string): Promise<Identity> {
        return this.provider.getIdentityByAddress(address);
    }

}
