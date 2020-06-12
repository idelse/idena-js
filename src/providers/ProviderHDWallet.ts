import Provider from './Provider'
import Transaction from '../models/Transaction'
import Identity from '../models/Identity'
import { ProviderLocalKeyStore } from '../index'
import { Rpc } from '../services/Rpc'
const HDWallet = require('ethereum-hdwallet')

export = class ProviderHDWallet implements Provider {
  private wallet: any
  private derivationPath: string
  private rpc: Rpc

  constructor (
    mnemonic?: string,
    derivationPath: string = "m/44'/515'/0'/0",
    indexPath: number = 0,
    uri: string = 'https://rpc.idena.dev'
  ) {
    if (mnemonic === undefined) throw Error('A mnemonic must be provided')
    this.wallet = HDWallet.fromMnemonic(mnemonic)
    this.rpc = new Rpc(uri)
    this.derivationPath = derivationPath
  }

  async sign (message: Buffer, index: number = 0): Promise<Buffer> {
    return this.getLocalKeyStoreProviderByIndex(index).sign(message)
  }

  inject (signedMessage: Buffer): Promise<string> {
    const hexSignedMessage = '0x' + signedMessage.toString('hex')
    return this.rpc.inject(hexSignedMessage)
  }

  getAddress (index: number = 0): Promise<string> {
    return this.getLocalKeyStoreProviderByIndex(index).getAddress()
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

  getMaxFeePerByte (): Promise<number> {
    return this.rpc.getMaxFeePerByte()
  }

  close (): Promise<void> {
    return undefined
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
}
