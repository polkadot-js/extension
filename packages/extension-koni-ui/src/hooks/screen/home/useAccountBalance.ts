import {AccountBalanceType, CrowdloanContributeValueType} from "@polkadot/extension-koni-ui/hooks/screen/home/types";
import {useSelector} from "react-redux";
import {RootState} from "@polkadot/extension-koni-ui/stores";
import BigN from "bignumber.js";
import {BalanceInfo} from "@polkadot/extension-koni-ui/util/types";
import {APIItemState, ChainRegistry, NetWorkGroup} from "@polkadot/extension-base/background/KoniTypes";
import {BN_ZERO, getBalances, parseBalancesInfo} from '@polkadot/extension-koni-ui/util';

function getCrowdloadChainRegistry(group: NetWorkGroup, chainRegistryMap: Record<string, ChainRegistry>): ChainRegistry | null {
  if (group === 'POLKADOT_PARACHAIN' && chainRegistryMap['polkadot']) {
    return chainRegistryMap['polkadot'];
  }

  if (group === 'KUSAMA_PARACHAIN' && chainRegistryMap['kusama']) {
    return chainRegistryMap['kusama'];
  }

  return null;
}

export default function useAccountBalance(
  currentNetworkKey: string,
  showedNetworks: string[],
  crowdloanNetworks: string[]): AccountBalanceType {
  const {
    chainRegistry: chainRegistryMap,
    balance: balanceReducer,
    price: priceReducer,
    crowdloan: crowdloanReducer,
    networkMetadata: networkMetadataMap,
  } = useSelector((state: RootState) => state);

  const balanceMap = balanceReducer.details;
  const crowdLoanMap = crowdloanReducer.details;
  const {priceMap} = priceReducer;

  let totalBalanceValue = new BigN(0);
  const networkBalanceMaps: Record<string, BalanceInfo> = {};
  const crowdloanContributeMap: Record<string, CrowdloanContributeValueType> = {};

  showedNetworks.forEach(networkKey => {
    const registry = chainRegistryMap[networkKey];
    const balanceItem = balanceMap[networkKey];

    if (!registry || !balanceItem) {
      return;
    }

    if (balanceItem.state.valueOf() === APIItemState.NOT_SUPPORT.valueOf()) {
      networkBalanceMaps[networkKey] = {
        symbol: 'Unit',
          balanceValue: BN_ZERO,
          convertedBalanceValue: BN_ZERO,
          detailBalances: [],
          childrenBalances: []
      };

      return;
    }

    if (balanceItem.state.valueOf() !== APIItemState.READY.valueOf()) {
      return;
    }

    const balanceInfo = parseBalancesInfo(priceMap, {
      networkKey,
      tokenDecimals: registry.chainDecimals,
      tokenSymbol: registry.chainTokens,
      info: {
        [registry.chainTokens[0]]: {
          freeBalance: balanceItem.free || '0',
          frozenFee: balanceItem.feeFrozen || '0',
          reservedBalance: balanceItem.reserved || '0',
          frozenMisc: balanceItem.miscFrozen || '0'
        }
      }
    })

    networkBalanceMaps[networkKey] = balanceInfo;
    totalBalanceValue = totalBalanceValue.plus(balanceInfo.convertedBalanceValue);
  });

  crowdloanNetworks.forEach(networkKey => {
    const networkMetadata = networkMetadataMap[networkKey];

    if (!networkMetadata) {
      return;
    }

    const registry = getCrowdloadChainRegistry(networkMetadata.group, chainRegistryMap);
    const crowdLoanItem = crowdLoanMap[networkKey];

    if (!registry
        || !crowdLoanItem
        || crowdLoanItem.state.valueOf() !== APIItemState.READY.valueOf()) {
      return;
    }

    const contributeInfo = getBalances({
      balance: crowdLoanItem.contribute,
      decimals: registry.chainDecimals[0],
      symbol: registry.chainTokens[0],
      price: priceMap[networkKey]
    })

    crowdloanContributeMap[networkKey] = {
      paraState: crowdLoanItem.paraState,
      contribute: contributeInfo
    };

    if (['all', 'polkadot', 'kusama'].includes(currentNetworkKey)) {
        totalBalanceValue = totalBalanceValue.plus(contributeInfo.convertedBalanceValue);
    }
  });

  return {
    totalBalanceValue,
    networkBalanceMaps,
    crowdloanContributeMap
  };
}
