import { connectChains } from "../connector"
import { isValidAddress, loadJSON, toUnit } from "./utils"
// import {connectChains} from "../connectors/wsProvider.js"


interface chainInfo {
   chainId: number;
   paraId: number;
}

// returns [{chainId, paraId},...]
export const getAllChainsMapping = () => {
  const rawMeta = loadJSON('./endpoints/manifest.json')
  let allMeta: any[] = []
  for (const [chainId, paraChain] of Object.entries(rawMeta)) {
    // @ts-ignore
    for (const [paraId] of Object.entries(paraChain)) {
      allMeta.push({chainId: parseInt(chainId), paraId: parseInt(paraId)})
    }
  }

  return allMeta
}

export const getChainMetadata = ({ chainId, paraId }: chainInfo) => {
   const manifestPath = `./endpoints/${chainId}/${paraId}/manifest.json`
   return loadJSON(manifestPath)
}

export const getBalances = async (targetChains: Array<any>, address: string) => {
   if (!isValidAddress(address)) {
      console.log('Invalid address.')
      return null
   }

   if (targetChains.length <= 0) {
      console.log('Must pass at least 1 chain.')
      return null
   }

   let chainDict: Record<string, Object> = {}
   targetChains.map(function (item: any, i: number)  {
     if (!("paraId" in item) || !("chainId" in item)) {
       console.log("Must include chainId")
       return
     }
     const chainMetadata = getChainMetadata({chainId: item.chainId, paraId: item.paraId})
     chainDict[i] = {chainId: item.chainId, paraId: item.paraId, ...chainMetadata}
   })

   const apis = await connectChains(targetChains)
   if(!apis) return undefined
   const balances = await Promise.all(apis.map(api => api.query.system.account(address)))
   let polkadotBalance: Record<string, Object> = {}
   let kusamaBalance: Record<string, Object> = {}
   balances.map((item, i) => {
      const { nonce, data: balance } = item
      const currentChain = chainDict[i] as any // can do this because Promise doesnt change the order
      if (currentChain.chainId === 0) { // Polkadot
         polkadotBalance[currentChain.paraId] = {
            nonce: nonce.toNumber(),
            freeBalance: toUnit(balance.free, currentChain.tokenDecimals),
            reservedBalance: toUnit(balance.reserved, currentChain.tokenDecimals),
            unit: currentChain.nativeToken
         }
      }
      else { // Kusama
         kusamaBalance[currentChain.paraId] = {
            nonce: nonce.toNumber(),
            freeBalance: toUnit(balance.free, currentChain.tokenDecimals),
            reservedBalance: toUnit(balance.reserved, currentChain.tokenDecimals),
            unit: currentChain.nativeToken
         }
      }

   })
   apis.map(api => api.disconnect())

   return {
      0: polkadotBalance,
      2: kusamaBalance
   }
}

export const subscribeBalances = async (targetChains: any[], address: string) => {
   if (!isValidAddress(address)) {
      console.log('Invalid address.')
      return
   }

   if (targetChains.length <= 0) {
      console.log('Must pass at least 1 chainId.')
      return
   }

   let balanceDict: Record<number, any> = {
      0: {},
      2: {}
   }
   let chainDict: Record<string, Object> = {}
   targetChains.map((item, i) => {
      const chainMetadata = getChainMetadata({ chainId: item.chainId, paraId: item.paraId })
      chainDict[i] = { chainId: item.chainId, paraId: item.paraId, ...chainMetadata }
   })

   const apis: any[] | undefined = await connectChains(targetChains)

   if(!apis) return
   apis.map(async (api, i) => {
      let { data: previousBalance, nonce: previousNonce } = await api.query.system.account(address)
      let previousFree = previousBalance.free
      let previousReserved = previousBalance.reserved
      const currentChain: any = chainDict[i]

      balanceDict[currentChain.chainId][currentChain.paraId] = {
         nonce: previousNonce.toNumber(),
         freeBalance: toUnit(previousFree, currentChain.tokenDecimals),
         reservedBalance: toUnit(previousReserved, currentChain.tokenDecimals),
         unit: currentChain.nativeToken
      }

      api.query.system.account(address, ({ data, nonce }: any ) => {
         // Calculate the delta
         const currentBalance = data
         const currentNonce = nonce
         const currentFree = currentBalance.free
         const currentReserved = currentBalance.reserved
         const change = currentFree.sub(previousFree)
         // Only display positive value changes (Since we are pulling `previous` above already,
         // the initial balance change will also be zero)
         if (!change.isZero()) {
            balanceDict[currentChain.chainId][currentChain.paraId] = {
               nonce: currentNonce.toNumber(),
               freeBalance: toUnit(currentFree, currentChain.tokenDecimals),
               reservedBalance: toUnit(currentReserved, currentChain.tokenDecimals),
               unit: currentChain.nativeToken
            }
            console.log('Latest balance:', balanceDict)
         }
         else console.log('No change detected')
      })
   })
}


