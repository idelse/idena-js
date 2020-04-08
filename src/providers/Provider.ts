export default interface Provider {

    getAddress(): Promise<string>;
    sign(message: Buffer): Promise<Buffer>;
    inject(signedTransaction: Buffer): Promise<string>;
    signAndInject(message: Buffer): Promise<string>;
    getEpoch(): Promise<number>;
    getNonceByAddress(address: string): Promise<number>;
}