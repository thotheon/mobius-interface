// To-Do: Implement Hooks to update Client-Side contract representation
import { JSBI, Percent, Token, TokenAmount } from '@ubeswap/sdk'
import { TokenList } from '@uniswap/token-lists'
import { Chain, Coins } from 'constants/StablePools'
import { useActiveContractKit } from 'hooks'
import { useLiquidityGaugeContract, useStableSwapContract } from 'hooks/useContract'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useEthBtcPrice } from 'state/application/hooks'
import { useDefaultTokenList, WrappedTokenInfo } from 'state/lists/hooks'
import { useSingleContractMultipleData } from 'state/multicall/hooks'
import { tryParseAmount } from 'state/swap/hooks'

import { StableSwapMath } from '../../utils/stableSwapMath'
import { AppState } from '..'
import { StableSwapConstants, StableSwapPool } from './reducer'
import { BigIntToJSBI } from './updater'

export interface StablePoolInfo {
  readonly name: string
  readonly poolAddress?: string
  readonly stakingToken?: Token
  readonly lpToken?: Token
  readonly tokens: readonly Token[]
  readonly amountDeposited?: TokenAmount
  readonly totalDeposited: TokenAmount
  readonly apr?: TokenAmount
  readonly totalStakedAmount?: TokenAmount
  readonly workingSupply?: JSBI
  readonly stakedAmount: TokenAmount
  readonly totalVolume?: TokenAmount
  readonly peggedTo: string
  readonly displayDecimals: number
  readonly virtualPrice: JSBI
  readonly priceOfStaked: TokenAmount
  readonly balances: TokenAmount[]
  readonly pegComesAfter: boolean | undefined
  readonly mobiRate: JSBI | undefined
  readonly pendingMobi: JSBI | undefined
  readonly gaugeAddress?: string
  readonly workingPercentage: Percent
  readonly totalPercentage: Percent
  readonly externalRewardRates?: TokenAmount[]
  readonly lastClaim?: Date
  readonly meta?: string
  readonly displayChain: Chain
  readonly coin: Coins
  readonly isDisabled?: boolean
}

export function useCurrentPool(tok1: string, tok2: string): readonly [StableSwapPool | undefined] {
  const withMetaPools = useSelector<AppState, (StableSwapPool | StableSwapConstants)[]>((state) =>
    Object.values(state.stablePools.pools).map(({ pool }) => {
      if (!pool.metaPool || pool.disabled) return pool
      const underlying = state.stablePools.pools[pool.metaPool]?.pool
      console.log(pool)
      return {
        ...pool,
        tokenAddresses: pool.tokenAddresses.concat(underlying.tokenAddresses),
      }
    })
  )
  const pools = withMetaPools.filter(({ tokenAddresses }) => {
    return tokenAddresses.includes(tok1) && tokenAddresses.includes(tok2)
  })

  return [pools.length > 0 ? pools[0] : null]
}

export function usePools(): readonly StableSwapPool[] {
  const pools = useSelector<AppState, StableSwapPool[]>((state) =>
    Object.values(state.stablePools.pools).map(({ pool }) => pool)
  )
  return pools
}

const tokenAmountScaled = (token: Token, amount: JSBI): TokenAmount =>
  new TokenAmount(token, JSBI.divide(amount, JSBI.exponentiate(JSBI.BigInt('10'), JSBI.BigInt(token.decimals))))

export const getPoolInfo = (
  pool: StableSwapPool,
  tokens: {
    [tokenAddress: string]: {
      token: WrappedTokenInfo
      list: TokenList
    }
  } = {}
): StablePoolInfo => ({
  name: pool.name,
  poolAddress: pool.address,
  lpToken: pool.lpToken,
  tokens: pool.tokens,
  amountDeposited: new TokenAmount(pool.lpToken, JSBI.add(pool.lpOwned, pool.userStaked ?? JSBI.BigInt('0'))),
  totalDeposited: new TokenAmount(pool.lpToken, pool.lpTotalSupply),
  stakedAmount: new TokenAmount(pool.lpToken, pool.userStaked || JSBI.BigInt('0')),
  apr: new TokenAmount(pool.lpToken, JSBI.BigInt('100000000000000000')),
  peggedTo: pool.peggedTo,
  virtualPrice: pool.virtualPrice,
  priceOfStaked: tokenAmountScaled(
    pool.lpToken,
    JSBI.multiply(pool.virtualPrice, JSBI.add(pool.lpOwned, pool.userStaked || JSBI.BigInt('0')))
  ),
  workingSupply: pool.workingLiquidity,
  balances: pool.tokens.map((token, i) => new TokenAmount(token, pool.balances[i] ?? '0')),
  pegComesAfter: pool.pegComesAfter,
  mobiRate: pool.totalMobiRate,
  pendingMobi: pool.pendingMobi,
  gaugeAddress: pool.gaugeAddress,
  displayDecimals: pool.displayDecimals,
  totalStakedAmount: new TokenAmount(pool.lpToken, pool.totalStakedAmount ?? '0'),
  workingPercentage: new Percent(pool.effectiveBalance, pool.totalEffectiveBalance),
  totalPercentage: new Percent(pool.userStaked ?? '0', pool.totalStakedAmount ?? '1'),
  externalRewardRates:
    pool.additionalRewardRate?.map(
      (rate, i) =>
        tokens[pool.additionalRewards?.[i]] && new TokenAmount(tokens[pool.additionalRewards?.[i] ?? ''].token, rate)
    ) ?? undefined,
  lastClaim: pool.lastClaim,
  meta: pool.metaPool,
  displayChain: pool.displayChain,
  coin: pool.coin,
  isDisabled: pool.disabled,
})

export function useStablePoolInfoByName(name: string): StablePoolInfo | undefined {
  const pool = useSelector<AppState, StableSwapPool>((state) => state.stablePools.pools[name.toLowerCase()]?.pool)
  const { chainId } = useActiveContractKit()
  const tokens = useDefaultTokenList()[chainId]
  return !pool ? undefined : { ...getPoolInfo(pool, tokens) }
}

export function useStablePoolInfo(): readonly StablePoolInfo[] {
  const pools = usePools()
  const { chainId } = useActiveContractKit()
  const tokens = useDefaultTokenList()[chainId]
  return pools.map((pool) => getPoolInfo(pool, tokens))
}

export function useExpectedTokens(pool: StablePoolInfo, lpAmount: TokenAmount): TokenAmount[] {
  const contract = useStableSwapContract(pool.poolAddress)
  const { tokens } = pool
  const { account } = useActiveContractKit()
  const [expectedOut, setExpectedOut] = useState<TokenAmount[]>(
    tokens.map((token) => new TokenAmount(token, JSBI.BigInt('0')))
  )
  useEffect(() => {
    const updateData = async () => {
      try {
        const newTokenAmounts = await contract?.calculateRemoveLiquidity(account, lpAmount.raw.toString())
        setExpectedOut(tokens.map((token, i) => new TokenAmount(token, JSBI.BigInt(newTokenAmounts[i].toString()))))
      } catch (e) {
        console.error(e)
        setExpectedOut(tokens.map((token, i) => new TokenAmount(token, JSBI.BigInt('0'))))
      }
    }
    lpAmount && lpAmount.raw && updateData()
  }, [account, lpAmount])
  return expectedOut
}

export function useExpectedLpTokens(
  pool: StablePoolInfo,
  tokens: Token[],
  input: (string | undefined)[],
  isDeposit = true
): [TokenAmount, TokenAmount[]] {
  const mathUtil = useMathUtil(pool.poolAddress ?? pool.address)
  const tokenAmounts = useMemo(
    () => tokens.map((t, i) => tryParseAmount(input[i], t) ?? new TokenAmount(t, '0')),
    [input]
  )
  //console.log(input)
  return useMemo(() => {
    // console.log(tokenAmounts)
    // console.log(pool.amountDeposited)
    const allZero = tokenAmounts.reduce((accum, cur) => accum && cur.equalTo('0'), true)
    if (allZero) {
      return [new TokenAmount(pool.lpToken, '0'), tokenAmounts]
    }
    if (!pool.totalDeposited || pool.totalDeposited.equalTo('0')) {
      const amount =
        tryParseAmount(
          tokenAmounts.reduce((accum, cur) => (parseInt(accum) + parseInt(cur.toFixed())).toString(), '0'),
          pool.lpToken
        ) ?? new TokenAmount(pool.lpToken, '0')
      return [amount, tokenAmounts]
    }
    const amount =
      mathUtil?.calculateTokenAmount(
        tokenAmounts.map((ta) => ta?.raw || JSBI.BigInt('0')),
        isDeposit
      ) ?? JSBI.BigInt('0')
    return [new TokenAmount(pool.lpToken, amount), tokenAmounts]
  }, [input, mathUtil, tokenAmounts])
}

export function useMathUtil(pool: StableSwapPool | string): StableSwapMath | undefined {
  const name = !pool ? '' : typeof pool == 'string' ? pool : pool.address
  const math = useSelector<AppState, StableSwapMath>((state) => state.stablePools.pools[name.toLowerCase()]?.math)
  return math
}

export function useUnderlyingPool(metaPoolName: string): StableSwapPool | undefined {
  const underlying = useSelector<AppState, StableSwapPool>((state) => {
    const meta = state.stablePools.pools[metaPoolName]?.pool
    if (!meta || !meta.metaPool) return meta
    return state.stablePools.pools[meta.metaPool]?.pool
  })
  return underlying
}

export function usePool(): readonly [StableSwapPool] {
  const [tok1, tok2] = useSelector<AppState, [string, string]>((state) => [
    state.swap.INPUT.currencyId,
    state.swap.OUTPUT.currencyId,
  ])
  return useCurrentPool(tok1, tok2)
}

export function usePriceOfLp(address: string, amountOfLp: TokenAmount): TokenAmount | undefined {
  const pool = useStablePoolInfoByName(address)
  const price = useEthBtcPrice(pool?.poolAddress ?? '')
  return pool && price && amountOfLp
    ? new TokenAmount(
        amountOfLp.token,
        JSBI.divide(
          JSBI.multiply(amountOfLp.raw, JSBI.multiply(pool?.virtualPrice, price)),
          JSBI.exponentiate(JSBI.BigInt('10'), JSBI.BigInt('18'))
        )
      )
    : undefined
}

export function useExternalRewards({ address }: { address: string }): TokenAmount[] {
  const pool = useSelector<AppState, StableSwapPool>((state) => state.stablePools.pools[address.toLowerCase()]?.pool)
  const gauge = useLiquidityGaugeContract(pool?.gaugeAddress ?? undefined)
  const { account, chainId } = useActiveContractKit()
  gauge?.claimable_reward_write
  const tokens = useDefaultTokenList()[chainId]
  const claimableTokens = useSingleContractMultipleData(
    gauge,
    'claimable_reward_write',
    pool?.additionalRewards?.map((token) => [account ?? undefined, token ?? undefined]) ?? undefined
  )
  // console.log(claimableTokens)
  const externalRewards = claimableTokens?.map(
    (result, i) =>
      new TokenAmount(
        tokens[pool?.additionalRewards?.[i] ?? '']?.token,
        BigIntToJSBI(result?.result?.[0] ?? '0', '0') ?? '0'
      )
  )
  return externalRewards
}
