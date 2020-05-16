import Provider from '../providers/Provider'
import Operation from './Operation'
const RLP = require('rlp')

export interface TransactionParameters {
  nonce?: number
  epoch?: number
  type?: number
  from?: string
  blockHash?: string
  to: string
  amount: number
  maxFee?: number
  tips?: number
  payload?: string | Buffer
  signature?: string | Buffer
  hash?: string
  usedFee?: number
  timestamp?: Date
}

export default class Transaction implements TransactionParameters {
  private provider: Provider

  nonce?: number
  epoch?: number
  type?: number
  from?: string
  blockHash?: string
  to: string
  amount: number
  maxFee?: number
  tips?: number
  payload?: string | Buffer
  signature?: string | Buffer
  hash?: string
  usedFee?: number
  timestamp?: Date

  constructor (provider: Provider) {
    this.provider = provider
  }

  async inject (): Promise<Operation> {
    const forged = await this.getForged()
    const signature = await this.provider.sign(forged)
    const signedTransaction = await this.getForged(signature)
    this.hash = await this.provider.inject(signedTransaction)
    return new Operation(this.provider, this.hash)
  }

  private feePerByte () {
    const networkSize = 2000
    return Math.max(1 / 10 ** 16, 0.1 / networkSize)
  }

  private baseTransactionFee () {
    const averageTransactionSize = 200
    return averageTransactionSize * this.feePerByte()
  }

  async getForged (signature?: Buffer): Promise<Buffer> {
    let payload
    if (this.nonce === undefined) {
      const address = await this.provider.getAddress()
      this.nonce = (await this.provider.getNonceByAddress(address)) + 1
    }
    if (this.epoch === undefined) {
      this.epoch = await this.provider.getEpoch()
    }
    if (this.payload !== undefined && this.payload instanceof Buffer)
      payload = '0x' + Buffer.from(this.payload).toString('hex')
    else if (
      (this.payload !== undefined && typeof this.payload === 'string') ||
      this.payload instanceof String
    )
      payload = '0x' + this.payload.replace('0x', '')
    else payload = '0x'
    if (this.signature !== undefined && this.signature instanceof Buffer)
      this.signature = '0x' + Buffer.from(this.signature).toString('hex')
    // https://bit.ly/2SIdJOb
    const baseTransactionFee = this.baseTransactionFee()
    const payloadBytes = payload.replace('0x', '').length / 2
    const maxFee =
      this.maxFee || baseTransactionFee + this.feePerByte() * payloadBytes
    const data = [
      this.nonce,
      this.epoch,
      this.type || 0,
      this.to,
      Math.round(this.amount * 10 ** 18),
      Math.round(maxFee * 10 ** 18),
      Math.round((this.tips || 0) * 10 ** 18),
      payload,
      signature || this.signature
    ].filter(v => v !== undefined)
    return RLP.encode(data)
  }

  static deserialize (
    provider: Provider,
    data: TransactionParameters
  ): Transaction {
    return Object.assign(new Transaction(provider), data)
  }
}
