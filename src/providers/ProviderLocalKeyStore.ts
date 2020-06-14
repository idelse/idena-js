import IdenaProvider from './IdenaProvider'
import { SigningKey, keccak256 } from 'ethers/utils'
import { Wallet } from 'ethers'
import { Rpc } from '../services/Rpc'

export = class ProviderLocalKeyStore extends IdenaProvider {
  private signingKey: SigningKey
  public rpc: Rpc

  constructor (privateKey?: string, uri: string = 'https://rpc.idena.dev') {
    super()
    if (privateKey === undefined) privateKey = Wallet.createRandom().privateKey
    this.signingKey = new SigningKey(privateKey)
    this.rpc = new Rpc(uri)
  }

  async signMessageByIndex (
    message: Buffer,
    index: number = 0
  ): Promise<Buffer> {
    const digest = keccak256(message)
    const sig = this.signingKey.signDigest(digest)
    return Buffer.concat([
      Buffer.from(sig.r.substr(2), 'hex'),
      Buffer.from(sig.s.substr(2), 'hex'),
      Buffer.from([sig.recoveryParam])
    ])
  }

  getAddressByIndex (index: number = 0): Promise<string> {
    return Promise.resolve(this.signingKey.address)
  }

  close (): Promise<void> {
    return undefined
  }
}
