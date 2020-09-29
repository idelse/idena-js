import request from 'request-promise'
import Identity from '../models/Identity'

export class Rpc {
  private uri: string

  constructor (uri: string) {
    this.uri = uri
  }

  async inject (signedMessage: Buffer): Promise<string> {
    const hexSignedMessage = '0x' + signedMessage.toString('hex')
    return this.request('bcn_sendRawTx', [hexSignedMessage])
  }

  async getEpoch (): Promise<number> {
    const result = await this.request('dna_epoch')
    return result.epoch
  }

  async getNonceByAddress (address: string): Promise<number> {
    const { nonce } = await this.request('dna_getBalance', [address])
    return nonce
  }

  async getBalanceByAddress (
    address: string
  ): Promise<{ balance: number; stake: number }> {
    const { balance, stake } = await this.request('dna_getBalance', [address])
    return { balance, stake }
  }

  async getTransactionByHash (hash: string) {
    return this.request('bcn_transaction', [hash])
  }

  async getIdentityByAddress (address: string): Promise<Identity> {
    let identity: any = this.request('dna_identity', [address])
    identity.penalty = parseFloat(identity.penalty)
    return identity
  }

  async getMaxFeePerByte (): Promise<number> {
    return this.request('bcn_feePerGas')
      .then(r => parseFloat(r) / 10 ** 18)
      .then(r => r * 10)
  }

  private request (method: string, params: any[] = []) {
    return request({
      url: this.uri,
      json: {
        id: 1,
        method,
        params
      },
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      }
    }).then(r => {
      if (!r) {
        throw Error(`${method} could be blacklisted`)
      }
      if (r && r.error && r.error.message) throw Error(r.error.message)
      if (!r.result) throw Error('unknown error')
      return r.result
    })
  }
}
