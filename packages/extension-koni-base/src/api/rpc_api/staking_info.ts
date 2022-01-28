import {ApiPromise} from "@polkadot/api";

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
