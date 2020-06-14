import IdenaProvider from '../providers/IdenaProvider'
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
  private provider: IdenaProvider

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

  constructor (provider: IdenaProvider) {
    this.provider = provider
  }

  async inject (indexAddress: number = 0): Promise<Operation> {
    const forged = await this.getForged(indexAddress)
    const signature = await this.provider.signMessageByIndex(forged, indexAddress)
    const signedTransaction = await this.getForged(indexAddress, signature)
    this.hash = await this.provider.rpc.inject(signedTransaction)
    return new Operation(this.provider, this.hash)
  }

  private async baseTransactionFee () {
    const feePerByte = await this.provider.rpc.getMaxFeePerByte()
    const averageTransactionSize = 200
    return averageTransactionSize * feePerByte
  }

  async getForged (
    indexAddress: number = 0,
    signature?: Buffer
  ): Promise<Buffer> {
    let payload
    if (this.nonce === undefined) {
      const address = await this.provider.getAddressByIndex(indexAddress)
      this.nonce = (await this.provider.rpc.getNonceByAddress(address)) + 1
    }
    if (this.epoch === undefined) {
      this.epoch = await this.provider.rpc.getEpoch()
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
    const baseTransactionFee = await this.baseTransactionFee()
    const payloadBytes = payload.replace('0x', '').length / 2
    const maxFeePerByte = await this.provider.rpc.getMaxFeePerByte()
    const maxFee =
      this.maxFee || baseTransactionFee + maxFeePerByte * payloadBytes

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
    provider: IdenaProvider,
    data: TransactionParameters
  ): Transaction {
    return Object.assign(new Transaction(provider), data)
  }
}
