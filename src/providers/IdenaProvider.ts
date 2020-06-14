import Transaction, { TransactionParameters } from '../models/Transaction'
import { Rpc } from '../services/Rpc'
import Operation from '../models/Operation'
import Identity from '../models/Identity'

export default abstract class IdenaProvider {

  public rpc: Rpc

  /**
   * Retrieve address of the index-th manages address.
   * @param index
   */
  abstract getAddressByIndex(index: number): Promise<string>

  /**
   * Sign message using index-th privatekey.
   * @param message
   * @param index
   */
  abstract signMessageByIndex(message: Buffer, index: number): Promise<Buffer>

  /**
   * Retrieve balance of the index-th manages address.
   * @param index
   */
  async getBalanceByIndex (index: number = 0): Promise<{ balance: number; stake: number }> {
    const address = await this.getAddressByIndex(index)
    return this.rpc.getBalanceByAddress(address)
  }

  /**
   * Retrieve nonce of the index-th managed address.
   * @param index
   */
  async getNonceByIndex(index: number = 0): Promise<number> {
    const address = await this.getAddressByIndex(index)
    return this.rpc.getNonceByAddress(address)
  }

  async getIdentityByIndex(index: number = 0): Promise<Identity> {
    const address = await this.getAddressByIndex(index)
    return this.rpc.getIdentityByAddress(address)
  }

  /**
   * Transfer DNA using index-th managed address
   * @param parameters
   * @param index
   */
  async transferByIndex (
    parameters: TransactionParameters,
    index: number = 0
  ): Promise<Operation> {
    return Transaction.deserialize(this, parameters).inject(
      index
    )
  }

  /**
   * Retrieve transaction by operation.
   * @param operation
   */
  async getTransactionByOperation (operation: string | Operation): Promise<Transaction> {
    if (typeof operation === "string") {
      const result = await this.rpc.getTransactionByHash(operation)
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
    } else {
      let hash = operation.hash
      return this.getTransactionByOperation(hash)
    }
  }

  /**
   * Execute a bulk of transactions.
   *
   * @param transactions
   * @param indexAddress
   */
  async bulkTransactionsByIndex (
    transactions: TransactionParameters[],
    indexAddress: number = 0
  ): Promise<Operation[]> {
    const nonce = await this.getNonceByIndex(indexAddress)
    let ops: Operation[] = []
    for (let i = 0; i < transactions.length; ++i) {
      ops = [
        ...ops,
        await this.transferByIndex(
          {
            ...transactions[i],
            nonce: nonce + i + 1
          },
          indexAddress
        )
      ]
    }
    return ops
  }

  /**
   * Close provider connection. It could be useful on provider based on hardware.
   */
  abstract close(): Promise<void>

}
