import test from 'ava'
import { ProviderLocalKeyStore } from '../src/index'
import IdenaProvider from '../src/providers/IdenaProvider'
const HDWallet = require('ethereum-hdwallet')

test.beforeEach(async t => {
  const derivation = "m/44'/515'/0'/0/0"
  const privateKey = HDWallet.fromMnemonic(process.env.MNEMONIC)
    .derive(derivation)
    .getPrivateKey()
    .toString('hex')
  const idena = new ProviderLocalKeyStore(privateKey)
  const to = await idena.getAddressByIndex()
  t.context = { idena, to, privateKey }
})

test.serial('Transfer should be accepted.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const { to } = t.context
  let op = await idena.transferByIndex({ amount: 0.001, to })
  await op.confirmation()
  t.is(op.hash.length, 66)
})

test.serial('Two sequential transfers should be accepted.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const { to } = t.context
  let op1 = await idena.transferByIndex({ amount: 0.001, to })
  await op1.confirmation()
  let op2 = await idena.transferByIndex({ amount: 0.001, to })
  await op2.confirmation()
  t.is(op1.hash.length, 66)
  t.is(op2.hash.length, 66)
})

test.serial(
  'Transfer should be rejected due insufficient funds.',
  async (t: any) => {
    const idena: IdenaProvider = t.context.idena
  const { to } = t.context
    const error = await t.throwsAsync(async () => {
      await idena.transferByIndex({ amount: 100_000_000, to })
    })
    t.is(error.message, 'insufficient funds')
  }
)

test.serial('Bulk transactions should be accepted.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const { to } = t.context
  let ops = await idena.bulkTransactionsByIndex([
    { amount: 0.001, to },
    { amount: 0.001, to },
    { amount: 0.001, to }
  ])
  ops = await Promise.all(ops.map((op: any) => op.confirmation()))
  t.is(ops[0].hash.length, 66)
  t.is(ops[1].hash.length, 66)
  t.is(ops[2].hash.length, 66)
})

test.serial(
  'Get balance by address should return balance and stake.',
  async (t: any) => {
    const idena: IdenaProvider = t.context.idena
    const { to } = t.context
    const { balance, stake } = await idena.getBalanceByIndex(to)
    t.true(balance >= 0)
    t.true(stake >= 0)
  }
)

test.serial('Retrieve identity details by address.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const address = '0xd65fd9617609a5bc7cbe6f3cfdb53b51d6c33e5c'
  const identity = await idena.rpc.getIdentityByAddress(address)
  t.is(identity.address, address)
})

test.serial(
  'Transfer with large payload should be accepted.',
  async (t: any) => {
    const idena: IdenaProvider = t.context.idena
    const { to } = t.context
    let op = await idena.transferByIndex({
      amount: 0.001,
      to,
      payload:
        '0x000000000000000000000000000000000000000000000000000000000000000000'
    })
    await op.confirmation()
    t.is(op.hash.length, 66)
  }
)
