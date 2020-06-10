import Transaction from '../models/Transaction'
import Identity from '../models/Identity'

export default interface Provider {
  getAddress(index?: number): Promise<string>
  sign(message: Buffer, index?: number): Promise<Buffer>
  inject(signedTransaction: Buffer): Promise<string>
  getEpoch(): Promise<number>
  getNonceByAddress(address: string): Promise<number>
  getBalanceByAddress(
    address: string
  ): Promise<{ balance: number; stake: number }>
  getTransactionByHash(hash: string): Promise<Transaction>
  getIdentityByAddress(address: string): Promise<Identity>
  getMaxFeePerByte(): Promise<number>
  close(): Promise<void>
}
