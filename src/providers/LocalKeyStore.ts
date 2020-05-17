import Provider from './Provider'
import fetch from 'node-fetch'
import Transaction from '../models/Transaction'
import Identity from '../models/Identity'
import {
  keccak256,
  remove0x,
  generatePrivateKey,
  getPublicByPrivateKey,
  getAddressByPublicKey,
  secp256k1Sign
} from '../utilities/crypto'

export = class LocalKeyStore implements Provider {
  private readonly privateKey: string
  private rpc: string

  constructor (privateKey?: string, rpc: string = 'https://rpc.idena.dev') {
    if (privateKey === undefined) privateKey = generatePrivateKey()
    this.privateKey = remove0x(privateKey)
    this.rpc = rpc
  }

  async sign (message: Buffer): Promise<Buffer> {
    const digest = keccak256(message.toString('hex'))
    return secp256k1Sign(digest, this.privateKey)
  }

  inject (signedMessage: Buffer): Promise<string> {
    const hexSignedMessage = '0x' + signedMessage.toString('hex')
    return this.request('bcn_sendRawTx', [hexSignedMessage])
  }

  getAddress (): Promise<string> {
    const publicKey = getPublicByPrivateKey(this.privateKey)
    return Promise.resolve(getAddressByPublicKey(publicKey))
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

  async getTransactionByHash (hash: string): Promise<Transaction> {
    let result = await this.request('bcn_transaction', [hash])
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
    let identity: any = this.request('dna_identity', [address])
    identity.penalty = parseFloat(identity.penalty)
    return identity
  }

  private request (method: string, params: any[] = []) {
    return fetch(this.rpc, {
      body: JSON.stringify({
        id: 1,
        method,
        params
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(res => {
        if (!res) {
          throw Error(`${method} could be blacklisted`)
        }
        if (res && res.error && res.error.message)
          throw Error(res.error.message)
        if (!res.result) throw Error('unknown error')
        return res.result
      })
  }
}
