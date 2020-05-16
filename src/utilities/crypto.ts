import { Keccak } from 'sha3'
import * as secp256k1 from 'noble-secp256k1'

const createKeccakHash = new Keccak(256)

export function remove0x (msg: string): string {
  if (msg.slice(0, 2) === '0x') return msg.substr(2)
  return msg
}

function bufferToString (buffer: string | Buffer): string {
  if (typeof buffer === 'string') buffer = remove0x(buffer)
  if (buffer instanceof Buffer) buffer = buffer.toString('hex')
  return buffer
}

export function keccak256 (msg: string | Buffer): string {
  msg = bufferToString(msg)
  createKeccakHash.reset()
  return (
    '0x' +
    createKeccakHash
      .update(msg, 'hex')
      .digest()
      .toString('hex')
  )
}

export function generatePrivateKey () {
  return secp256k1.utils.randomPrivateKey().toString()
}

export function getPublicByPrivateKey (privateKey: string) {
  const publicKey = secp256k1.getPublicKey(privateKey).toString()
  return publicKey.substr(2)
}

export function getAddressByPublicKey (publicKey: string) {
  return '0x' + keccak256(publicKey).substr(26)
}

export async function secp256k1Sign (digest: string, privateKey: string) {
  digest = bufferToString(digest)
  let [sig, recoveryParam] = await secp256k1.sign(digest, privateKey, {
    recovered: true
  })
  const r = sig.slice(8, 72)
  const s = sig.slice(76, 140)
  return Buffer.concat([
    Buffer.from(r, 'hex'),
    Buffer.from(s, 'hex'),
    Buffer.from([recoveryParam])
  ])
}
