import Provider from "./Provider";
import request from "request-promise";
import { SigningKey, keccak256 } from "ethers/utils"

export default class LocalKeyStore implements Provider {

    private signingKey: SigningKey;
    private rpc: string;

    constructor(privateKey: string, rpc: string = "https://rpc.idena.dev") {
        this.signingKey = new SigningKey(privateKey);
        this.rpc = rpc;
    }

    async sign(message: Buffer): Promise<Buffer> {
        const digest = keccak256(message);
        const sig = this.signingKey.signDigest(digest);
        return Buffer.concat([
            Buffer.from(sig.r.substr(2), 'hex'),
            Buffer.from(sig.s.substr(2), 'hex'),
            Buffer.from([0]),
        ]);
    }

    inject(signedMessage: Buffer): Promise<string> {
        const hexSignedMessage = "0x"+signedMessage.toString("hex");
        return this.request("bcn_sendRawTx", [hexSignedMessage]);
    }

    async signAndInject(message: Buffer): Promise<string> {
        const signedMessage = await this.sign(message);
        return this.inject(signedMessage);
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
        }).then(result => {
            if (result.result)
                return result.result;
            if (result.error)
                throw Error(JSON.stringify(result.error));
            throw Error("Unknown error.");
        });
    }

}
