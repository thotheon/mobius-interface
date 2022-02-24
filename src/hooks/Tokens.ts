import { Token } from '@ubeswap/sdk'
import { MENTO_POOL_INFO } from 'constants/mento'
import { StablePools } from 'constants/pools'
import { stableToToken } from 'state/mentoPools/hooks'
import { dedupeTokens } from 'utils/tokens'

import { CHAIN } from '../constants'
import { CELO, ExternalRewards, MOBI, VEMOBI } from '../constants/tokens'
import { isAddress } from '../utils'

export function useSwappableTokens(mento: boolean): Token[] {
  return dedupeTokens(mento ? getMentoTokens() : StablePools[CHAIN].flatMap((display) => display.pool.tokens))
}

export function getMentoTokens(): Token[] {
  return MENTO_POOL_INFO[CHAIN].map((m) => stableToToken(m.stable)).concat(CELO[CHAIN])
}

export function getAllTokens(): Token[] | null {
  const StableTokensWithDup = StablePools[CHAIN].flatMap((display) => display.pool.tokens)
  const MentoTokensWithDup = getMentoTokens()
  return dedupeTokens(MentoTokensWithDup.concat(StableTokensWithDup).concat(ExternalRewards[CHAIN]))
}

// undefined if invalid or does not exist
// null if loading
// otherwise returns the token
export function addressToToken(tokenAddress?: string): Token | null {
  const tokens = getAllTokens()

  const address = isAddress(tokenAddress)
  const token = tokens?.filter((t) => t.address === address)[0]
  return token ?? null
}

export function useCurrency(currencyId: string | undefined): Token | null {
  const token = addressToToken(currencyId)
  return token
}

export function useMobi(): Token {
  return MOBI[CHAIN]
}

export function useVeMobi(): Token {
  return VEMOBI[CHAIN]
}
