import { getAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { swappaRouterV1Address } from '@mobius-money/swappa'
import { JSBI, Percent, TokenAmount } from '@ubeswap/sdk'
import { Exchange, Swap, SwappaRouterV1 } from 'generated/index'

import EXCHANGE from '../constants/abis/Exchange.json'
import SWAP from '../constants/abis/Swap.json'
import SWAPPA_ROUTER from '../constants/abis/SwappaRouterV1.json'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 100%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(2))
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: TokenAmount, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000)),
  ]
}

// account is not optional
export function getSigner(provider: Web3Provider): JsonRpcSigner {
  return provider.getSigner()
}

// account is optional
export function getProviderOrSigner(provider: Web3Provider, connected: boolean): Web3Provider | JsonRpcSigner {
  return connected ? getSigner(provider) : provider
}

// account is optional
export function getContract(address: string, ABI: any, provider: Web3Provider, connected: boolean): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return new Contract(address, ABI, getProviderOrSigner(provider, connected) as any)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function getStableSwapContract(address: string, provider: Web3Provider, connected: boolean): Swap {
  return getContract(address, SWAP.abi, provider, connected) as Swap
}

export function getMentoContract(address: string, provider: Web3Provider, connected: boolean): Exchange {
  return getContract(address, EXCHANGE, provider, connected) as Exchange
}

export function getSwappaRouterV1Contract(provider: Web3Provider, connected: boolean): SwappaRouterV1 {
  return getContract(swappaRouterV1Address, SWAPPA_ROUTER, provider, connected) as SwappaRouterV1
}
