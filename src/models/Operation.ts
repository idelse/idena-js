import Provider from "../providers/Provider";

export default class Operation {

    private provider?: Provider;
    public hash: string;

    constructor(provider: Provider, hash: string) {
        this.provider = provider;
        this.hash = hash;
    }

    async confirmation(): Promise<Operation> {
        return new Promise((resolve, reject) => {
            let i = 70;
            const interval = setInterval(async () => {
                if (i === 0) reject(new Error("Error timeout"));
                const transaction = await this.provider.getTransactionByHash(this.hash);
                if (transaction.usedFee > 0) {
                    clearInterval(interval);
                    resolve(this);
                }
                i--;
            }, 1000);
        });
    }

}
