import Provider from './Provider'
import request from 'request-promise'
import Transaction from '../models/Transaction'
import Identity from '../models/Identity'
const HDWallet = require('ethereum-hdwallet')

export = class ProviderLocalKeyStore implements Provider {
  private wallet: any
  private derivationPath: string
  private rpc: string

  constructor (
    mnemonic?: string,
    rpc: string = 'https://rpc.idena.dev',
    derivationPath: string = "m/44'/515'/0'/0"
  ) {
    if (mnemonic === undefined) throw Error('A mnemonic must be provided')
    this.wallet = HDWallet.fromMnemonic(mnemonic)
    this.rpc = rpc
    this.derivationPath = derivationPath
  }

  async sign (message: Buffer, index: number = 0): Promise<Buffer> {
    return this.getLocalKeyStoreProviderByIndex(index).sign(message)
  }

  inject (signedMessage: Buffer): Promise<string> {
    const hexSignedMessage = '0x' + signedMessage.toString('hex')
    return this.request('bcn_sendRawTx', [hexSignedMessage])
  }

  getAddress (index: number = 0): Promise<string> {
    return this.getLocalKeyStoreProviderByIndex(index).getAddress()
  }

  private getLocalKeyStoreProviderByIndex (
    index: number = 0
  ): ProviderLocalKeyStore {
    const derivation = `${this.derivationPath}/${index}`
    const privateKey = this.wallet
      .derive(derivation)
      .getPrivateKey()
      .toString('hex')
    return new ProviderLocalKeyStore(privateKey)
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
    return request({
      url: this.rpc,
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

  getMaxFeePerByte (): Promise<number> {
    return undefined
  }

  close (): Promise<void> {
    return undefined
  }
}
