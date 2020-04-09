import Provider from "../providers/Provider";
import Transaction, { TransactionParameters } from "./Transaction";
import Operation from "./Operation";

export default class Idena {

    private provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    async transfer(parameters: TransactionParameters): Promise<Operation> {
        return Transaction.deserialize(this.provider, parameters).inject();
    }

    async bulkTransactions(transactions: TransactionParameters[]): Promise<Operation[]> {
        const address = await this.provider.getAddress();
        const nonce = await this.provider.getNonceByAddress(address);
        let ops: Promise<Operation>[] = transactions
            .map((transaction, i) => this.transfer({ ...transaction, nonce: nonce + i + 1 }));
        return Promise.all(ops);
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

}