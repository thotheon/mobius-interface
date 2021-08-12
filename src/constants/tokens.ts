import { ChainId, Token } from '@ubeswap/sdk'
import mapValues from 'lodash/mapValues'

const makeTokens = (
  addresses: { [net in ChainId]: string },
  decimals: number,
  symbol: string,
  name: string
): { [net in ChainId]: Token } => {
  return mapValues(addresses, (tokenAddress, network) => {
    return new Token(parseInt(network), tokenAddress, decimals, symbol, name)
  })
}

export const UBE = makeTokens(
  {
    [ChainId.MAINNET]: '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC',
    [ChainId.ALFAJORES]: '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC',
    [ChainId.BAKLAVA]: '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC',
  },
  18,
  'UBE',
  'Ubeswap'
)

export const USD_LP = makeTokens(
  {
    [ChainId.MAINNET]: '0x751c70e8f062071bDE19597e2766a5078709FCb9',
    [ChainId.ALFAJORES]: '0x751c70e8f062071bDE19597e2766a5078709FCb9',
    [ChainId.BAKLAVA]: '0x751c70e8f062071bDE19597e2766a5078709FCb9',
  },
  18,
  'USD_LP',
  'USD LP Tokens'
)
