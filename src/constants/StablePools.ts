import { ChainId, JSBI, Token } from '@ubeswap/sdk'
import { StableSwapConstants } from 'state/stablePools/reducer'

export type StablePoolInfo = {
  poolAddress: string
  lpAddress: string
  token: Array<Token | string>
  name: string
}

export const STATIC_POOL_INFO: { [K in ChainId]: StableSwapConstants[] } = {
  [ChainId.MAINNET]: [],
  [ChainId.ALFAJORES]: [
    {
      name: 'test-pool-1',
      tokenAddresses: ['0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', '0x0Ce734Ffe87e7EEaEf8ef4A97dA4261966Ae4bEa'],
      tokens: [
        new Token(ChainId.ALFAJORES, '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', 18, 'cUSD', 'Celo Dollar'),
        new Token(ChainId.ALFAJORES, '0x0Ce734Ffe87e7EEaEf8ef4A97dA4261966Ae4bEa', 18, 'USDC', 'USD Coin'),
      ],
      address: '0x907251d7Ed4ba084f8Db377696F4a1679E424849',
      lpToken: new Token(ChainId.ALFAJORES, '0xa3629788a1a5276dD0586D270B899A32bEE4680f', 18),
      fee: JSBI.BigInt('0'),
      rates: [JSBI.BigInt('1'), JSBI.BigInt('1')],
      lendingPrecision: JSBI.BigInt('1'),
      precision: JSBI.BigInt('18'),
      feeDenominator: JSBI.BigInt('10000000000'),
      precisionMul: [JSBI.BigInt('1'), JSBI.BigInt('1')],
      feeIndex: 0,
      decimals: [JSBI.BigInt('18'), JSBI.BigInt('18')],
      peggedTo: '$',
    },
    {
      name: 'test-pool-2',
      tokenAddresses: ['0x55cfDcDd6766CDd58b9945C1A2933b4c38518dd7', '0xf0f4DF0cDE2C8cB8660ed022d7a22488F723e702'],
      tokens: [
        new Token(ChainId.ALFAJORES, '0x55cfDcDd6766CDd58b9945C1A2933b4c38518dd7', 18),
        new Token(ChainId.ALFAJORES, '0xf0f4DF0cDE2C8cB8660ed022d7a22488F723e702', 18),
      ],
      address: '0xa95B3abe4834b7310a0F12f67c35F73dbDc53a87',
      lpToken: new Token(ChainId.ALFAJORES, '0x5a26a9d8ef3ee6991946843251e274705370d129', 18),
      fee: JSBI.BigInt('0'),
      rates: [JSBI.BigInt('1'), JSBI.BigInt('1')],
      lendingPrecision: JSBI.BigInt('1'),
      precision: JSBI.BigInt('18'),
      feeDenominator: JSBI.BigInt('10000000000'),
      precisionMul: [JSBI.BigInt('1'), JSBI.BigInt('1')],
      feeIndex: 0,
      decimals: [JSBI.BigInt('18'), JSBI.BigInt('18')],
      peggedTo: '$',
    },
  ],
  [ChainId.BAKLAVA]: [],
}

export const STAKED_CELO_POOL: StablePoolInfo = {
  name: 'Staked CELO Pool',
  poolAddress: '0x000',
  lpAddress: '0x000',
  token: ['CELO', 'rCELO'],
}

export const USD_POOL: StablePoolInfo = {
  name: 'US Dollar Pool',
  poolAddress: '0xe83e3750eeE33218586015Cf3a34c6783C0F63Ac',
  lpAddress: '0x000',
  token: ['cUSD', 'USDC', 'USDT'],
}

export const EURO_POOL: StablePoolInfo = {
  name: 'Euro Pool',
  poolAddress: '0x0000',
  lpAddress: '0x000',
  token: ['cEUR', 'bEURS', 'mcEUR'],
}

export const STABLE_POOLS = [STAKED_CELO_POOL, USD_POOL, EURO_POOL]

//todo: replace Mainnet and Baklava Pool Addresses
export const USD_POOL_ADDRESSES = {
  [ChainId.MAINNET]: null,
  [ChainId.ALFAJORES]: '0xe83e3750eeE33218586015Cf3a34c6783C0F63Ac',
  [ChainId.BAKLAVA]: null,
}
