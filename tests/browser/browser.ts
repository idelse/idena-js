import $ from 'jquery'
import { ProviderLedger } from '../../src'
import Idena from '../../src/models/Idena'

const providerLedger = new ProviderLedger()
const idena = new Idena(providerLedger)

$(document).ready(() => {
  $('#connect_ledger').on('click', async () => {
    await providerLedger.connect()
  })

  $('#get_address').on('click', async () => {
    const address = await providerLedger.getAddress()
    console.log(`Address >> ${address}`)
  })

  $('#send_tx').on('click', async () => {
    const transfer = await idena.transfer({
      amount: 0.001,
      to: '0xcf979f9472e38d45c577394747a3028ea7433bb5'
    })
    const confirmation = await transfer.confirmation()
    console.log('Send transaction > ', confirmation)
  })
})
