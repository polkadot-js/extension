import {ApiPromise} from "@polkadot/api";
import {connectChains} from "@polkadot/extension-koni-base/api/connector";

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

export const getStakingInfo = async (): Promise<any> => {
  const apis = await connectChains([{chainId: 0, paraId: 0}, {chainId: 2, paraId: 2000}])
  return getMultiCurrentBonded( { apis, accountId: '111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S' } ).then(rs => {
    console.log(rs)
    expect(rs).not.toBeNaN()
  }).catch(err => {
    console.log(err)
  })
}
