import test from 'ava'
import { ProviderHDWallet } from '../src/index'
import IdenaProvider from '../src/providers/IdenaProvider'

test.beforeEach(async t => {
  const mnemonic = process.env.MNEMONIC
  const idena = new ProviderHDWallet(mnemonic)
  const to = await idena.getAddressByIndex()
  t.context = { idena, to, mnemonic }
})

test.serial(
  'Transfer should be accepted using 1-th address.',
  async (t: any) => {
    const idena: IdenaProvider = t.context.idena
    const { to } = t.context
    let op = await idena.transferByIndex({ amount: 0.001, to }, 1)
    await op.confirmation()
    t.is(op.hash.length, 66)
  }
)

test.serial('Two sequential transfers should be accepted.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const { to } = t.context
  let op1 = await idena.transferByIndex({ amount: 0.001, to }, 1)
  await op1.confirmation()
  let op2 = await idena.transferByIndex({ amount: 0.001, to }, 1)
  await op2.confirmation()
  t.is(op1.hash.length, 66)
  t.is(op2.hash.length, 66)
})

test.serial(
  'Transfer with large payload should be accepted using 1-th address.',
  async (t: any) => {
    const idena: IdenaProvider = t.context.idena
    const { to } = t.context
    let op = await idena.transferByIndex(
      {
        amount: 0.001,
        to,
        payload:
          '0x000000000000000000000000000000000000000000000000000000000000000000'
      },
      1
    )
    await op.confirmation()
    t.is(op.hash.length, 66)
  }
)

test.serial(
  'Bulk transactions should be accepted using 1-th address.',
  async (t: any) => {
    const idena: IdenaProvider = t.context.idena
    const { to } = t.context
    let ops = await idena.bulkTransactionsByIndex(
      [
        { amount: 0.001, to },
        { amount: 0.001, to },
        { amount: 0.001, to }
      ],
      1
    )
    ops = await Promise.all(ops.map((op: any) => op.confirmation()))
    t.is(ops[0].hash.length, 66)
    t.is(ops[1].hash.length, 66)
    t.is(ops[2].hash.length, 66)
  }
)

test.serial('Transfer using 2-th should be accepted.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const { to } = t.context
  let op = await idena.transferByIndex({ amount: 0.001, to }, 2)
  await op.confirmation()
  t.is(op.hash.length, 66)
})

test.serial('Check 0-th address.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const address = await idena.getAddressByIndex(0)
  t.is(address, '0x754B6e821CFB21E63b28FFDEaE2e593882d332d3')
})

test.serial('Check 1-th address.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const address = await idena.getAddressByIndex(1)
  t.is(address, '0x58c314ab00C90B4FfB98FdBE6C2747bd3c8B1D91')
})

test.serial('Check 2-th address.', async (t: any) => {
  const idena: IdenaProvider = t.context.idena
  const address = await idena.getAddressByIndex(2)
  t.is(address, '0x343ded888954BE862a3e8b5b512915Baa9aA20E9')
})
