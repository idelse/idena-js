import IdenaProvider from './IdenaProvider'
import { ProviderLocalKeyStore } from '../index'
import { Rpc } from '../services/Rpc'
const HDWallet = require('ethereum-hdwallet')

export = class ProviderHDWallet extends IdenaProvider {

  private wallet: any
  private derivationPath: string

  constructor (
    mnemonic?: string,
    derivationPath: string = "m/44'/515'/0'/0",
    indexPath: number = 0,
    uri: string = 'https://rpc.idena.dev'
  ) {
    super()
    if (mnemonic === undefined) throw Error('A mnemonic must be provided')
    this.wallet = HDWallet.fromMnemonic(mnemonic)
    this.rpc = new Rpc(uri)
    this.derivationPath = derivationPath
  }

  async signMessageByIndex (message: Buffer, index: number = 0): Promise<Buffer> {
    return this.getLocalKeyStoreProviderByIndex(index).signMessageByIndex(message)
  }

  getAddressByIndex (index: number = 0): Promise<string> {
    return this.getLocalKeyStoreProviderByIndex(index).getAddressByIndex()
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
