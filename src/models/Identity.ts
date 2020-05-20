export default interface Identity {
  address: string
  profileHash: string
  stake: number
  invites: number
  age: number
  state: string
  pubkey: string
  requiredFlips: number
  availableFlips: number
  flipKeyWordPairs: null
  madeFlips: number
  totalQualifiedFlips: number
  totalShortFlipPoints: number
  flips: string[]
  online: boolean
  generation: number
  code: string
  invitees: { TxHash: string; Address: string }[]
  penalty: number
  lastValidationFlags: any
}
