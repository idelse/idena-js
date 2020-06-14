import IdenaProvider from '../providers/IdenaProvider'

export default class Operation {
  private provider?: IdenaProvider
  public hash: string

  constructor (provider: IdenaProvider, hash: string) {
    this.provider = provider
    this.hash = hash
  }

  async confirmation (): Promise<Operation> {
    return new Promise((resolve, reject) => {
      let i = 15
      const interval = setInterval(async () => {
        if (i === 0) reject(new Error('Error timeout'))
        const transaction = await this.provider.getTransactionByOperation(
          this.hash
        )
        if (transaction.usedFee > 0) {
          clearInterval(interval)
          resolve(this)
        }
        i--
      }, 5000)
    })
  }
}
