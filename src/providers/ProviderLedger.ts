import Provider from './Provider'
import Transaction from '../models/Transaction'
import Identity from '../models/Identity'
// @ts-ignore
import Transport from '@ledgerhq/hw-transport-webusb'
import { decode } from '@stablelib/utf8'
import { Rpc } from '../services/Rpc'
const struct = require('python-struct')

export = class ProviderLedger implements Provider {
  // @ts-ignore
  private transport: any
  private address: string
  private addressIndex: number
  private rpc: Rpc

  constructor (uri: string = 'https://rpc.idena.dev') {
    this.rpc = new Rpc(uri)
  }

  async connect (addressIndex: number = 0) {
    if (this.transport) return
    this.transport = await Transport.create()
    this.transport.setScrambleKey('')
    if (!this.address) await this.getAddress(addressIndex)
  }

  private async exchange (cmd: Buffer): Promise<Uint8Array> {
    if (!this.transport) await this.connect()
    const resp = await this.transport.send(cmd)
    console.log('resp > ', resp)
    return Uint8Array.from(resp.slice(0, resp.length - 2))
  }

  private parseBip32Path (path: string) {
    if (path.length === 0) return new Uint8Array()
    let result: Buffer[] = []
    let elements = path.split('/')
    elements.forEach(pathElement => {
      const element = pathElement.split("'")
      if (element.length === 1)
        result = result.concat(struct.pack('>I', parseInt(element[0])))
      else
        result = result.concat(
          struct.pack('>I', ~0x80000000 + 1 + parseInt(element[0]))
        )
    })
    return Buffer.concat(result)
  }

  async sign (message: Buffer, addressIndex: number = 0): Promise<Buffer> {
    if (
      !this.transport ||
      !this.address ||
      !this.addressIndex ||
      this.addressIndex !== addressIndex
    )
      await this.connect(addressIndex)
    const donglePath = this.parseBip32Path(`44'/515'/0'/0/${this.addressIndex}`)
    const cmd = Buffer.concat([
      Buffer.from('e0040000', 'hex'),
      Buffer.from(String.fromCharCode(donglePath.length + 1 + message.length)),
      Buffer.from(String.fromCharCode(Math.floor(donglePath.length / 4))),
      donglePath,
      message
    ])
    const signedMessage = await this.exchange(cmd)
    if (signedMessage.length === 0) throw Error('Open idena-ledger app')
    return Buffer.from(signedMessage)
  }

  inject (signedMessage: Buffer): Promise<string> {
    const hexSignedMessage = '0x' + signedMessage.toString('hex')
    return this.rpc.inject(hexSignedMessage)
  }

  async getAddress (addressIndex: number = 0): Promise<string> {
    if (!this.transport) await this.connect()
    if (this.address) return this.address
    const donglePath = this.parseBip32Path(`44'/515'/0'/0/${addressIndex}`)

    const cmd = Buffer.concat([
      Buffer.from('e0020100', 'hex'),
      Buffer.from(String.fromCharCode(donglePath.length + 1)),
      Buffer.from(String.fromCharCode(Math.floor(donglePath.length / 4))),
      donglePath
    ])

    const resp = await this.exchange(cmd)
    if (resp.length === 0) throw Error('Open idena-ledger app')
    const offset = 1 + resp[0]
    const address =
      '0x' + decode(resp.slice(offset + 1, offset + 1 + resp[offset]))
    this.address = address
    this.addressIndex = addressIndex
    return address
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
    return this.transport.close()
  }
}
