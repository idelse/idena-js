import Provider from './Provider'
import { SigningKey, keccak256 } from 'ethers/utils'
import { Wallet } from 'ethers'
import Transaction from '../models/Transaction'
import Identity from '../models/Identity'
import { Rpc } from '../services/Rpc'

export = class ProviderLocalKeyStore implements Provider {
  private signingKey: SigningKey
  private rpc: Rpc

  constructor (privateKey?: string, uri: string = 'https://rpc.idena.dev') {
    if (privateKey === undefined) privateKey = Wallet.createRandom().privateKey
    this.signingKey = new SigningKey(privateKey)
    this.rpc = new Rpc(uri)
  }

  async sign (message: Buffer, index: number = 0): Promise<Buffer> {
    const digest = keccak256(message)
    const sig = this.signingKey.signDigest(digest)
    return Buffer.concat([
      Buffer.from(sig.r.substr(2), 'hex'),
      Buffer.from(sig.s.substr(2), 'hex'),
      Buffer.from([sig.recoveryParam])
    ])
  }

  inject (signedMessage: Buffer): Promise<string> {
    const hexSignedMessage = '0x' + signedMessage.toString('hex')
    return this.rpc.inject(hexSignedMessage)
  }

  getAddress (index: number = 0): Promise<string> {
    return Promise.resolve(this.signingKey.address)
  }

  async getEpoch (): Promise<number> {
    return this.rpc.getEpoch()
  }

  async getNonceByAddress (address: string): Promise<number> {
    return this.rpc.getNonceByAddress(address)
  }

  async getBalanceByAddress (
    address: string
  ): Promise<{ balance: number; stake: number }> {
    return this.rpc.getBalanceByAddress(address)
  }

  async getTransactionByHash (hash: string): Promise<Transaction> {
    const result = await this.rpc.getTransactionByHash(hash)
    return Transaction.deserialize(this, {
      hash: result.hash,
      nonce: result.nonce,
      type: result.type === 'send' ? 0 : -1,
      to: result.to,
      from: result.from,
      amount: result.amount,
      epoch: result.epoch,
      payload: result.payload,
      blockHash: result.blockHash,
      usedFee: result.usedFee,
      timestamp: new Date(result.timestamp * 1000)
    })
  }

  async getIdentityByAddress (address: string): Promise<Identity> {
    return this.rpc.getIdentityByAddress(address)
  }

  async getMaxFeePerByte (): Promise<number> {
    return this.rpc.getMaxFeePerByte()
  }

  close (): Promise<void> {
    return undefined
  }
}
