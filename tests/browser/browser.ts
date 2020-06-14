import $ from 'jquery'
import { ProviderLedger } from '../../src'

let idena = new ProviderLedger()

$(document).ready(() => {
  $('#connect_ledger').on('click', async () => {
    await idena.connect()
  })

  $('#get_address').on('click', async () => {
    const address = await idena.getAddressByIndex()
    console.log(`Address >> ${address}`)
  })

  $('#send_tx').on('click', async () => {
    const transfer = await idena.transferByIndex({
      amount: 0.001,
      to: '0xcf979f9472e38d45c577394747a3028ea7433bb5'
    })
    const confirmation = await transfer.confirmation()
    console.log('Send transaction > ', confirmation)
  })
  $('#clear').on('click', async () => {
    await idena.close()
    idena = new ProviderLedger()
  })
})
