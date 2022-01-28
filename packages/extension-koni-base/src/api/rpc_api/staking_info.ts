import {ApiPromise} from "@polkadot/api";
import {connectChains} from "@polkadot/extension-koni-base/api/connector";
import {StakingItem, StakingJson} from "@polkadot/extension-koni-base/stores/types";
import {getChainMetadata} from "@polkadot/extension-koni-base/api/rpc_api/index";

interface LedgerData {
   active: string,
   claimedRewards: string[],
   stash: string,
   total: string,
   unlocking: string[]
}
interface Props {
   api: ApiPromise,
   accountId: string
}

interface PropsMulti {
  apis: any,
  accountId: string,
}

export const getCurrentBonded = async ({api, accountId}: Props): Promise<string> => {
   const ledger = (await api.query.staking.ledger(accountId));
   const data = ledger.toHuman() as unknown as LedgerData
   return data.active
}

export const getMultiCurrentBonded = async ({apis, accountId}: PropsMulti): Promise<any> => {
  try {
    return await Promise.all(apis.map(async (api: any) => {
      const ledger = await api.query.staking?.ledger(accountId)

      if (ledger) {
        const data = ledger.toHuman() as unknown as LedgerData
        return data.active
      }
      return null
    }))
  } catch(e) {
    console.error('Error getting staking data', e)
    return null
  }
}

export const getStakingInfo = async (accountId: string): Promise<StakingJson> => {
  let result: any[] = []
  const targetChains = [{chainId: 0, paraId: 0}, {chainId: 2, paraId: 2000}]
  const apis = await connectChains(targetChains)
  const balances = await getMultiCurrentBonded( { apis, accountId: '111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S' } )
  for (let i in targetChains) {
    const currentChain = targetChains[i]
    const currentBalance = balances[i]
    const amount = currentBalance.split(' ')[0]
    const unit = currentBalance.split(' ')[1]
    const chainMeta = getChainMetadata({chainId: currentChain.chainId, paraId: currentChain.paraId})
    result.push({
      name: chainMeta.name ,
      chainId: (currentChain.chainId).toString(),
      paraId: (currentChain.paraId).toString(),
      balance: amount,
      nativeToken: chainMeta.nativeToken,
      unit: unit ? unit : chainMeta.nativeToken
    } as StakingItem)
  }
  return {
    details: result
  } as StakingJson
}
