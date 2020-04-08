import Provider from "./src/providers/Provider";
import { Transaction, TransactionParameters } from "./src/structures";

export default class Idena {

    private provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    async transfer(parameters: TransactionParameters): Promise<Transaction> {
        const transaction: Transaction = Transaction.deserialize(parameters);
        return transaction.inject(this.provider);
    }

}