// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainInfo, _CrowdloanFund, _FundStatus } from '@subwallet/chain-list/types';
import { APIItemState, CrowdloanItem, CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';
import { ACALA_REFRESH_CROWDLOAN_INTERVAL } from '@subwallet/extension-base/constants';
import registry from '@subwallet/extension-base/koni/api/dotsama/typeRegistry';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { categoryAddresses, fetchJson, reformatAddress } from '@subwallet/extension-base/utils';
import { fetchStaticData } from '@subwallet/extension-base/utils/fetchStaticData';

import { DeriveOwnContributions } from '@polkadot/api-derive/types';
import { BN } from '@polkadot/util';

const STATUS_MAP: Record<_FundStatus, CrowdloanParaState> = {
  [_FundStatus.IN_AUCTION]: CrowdloanParaState.ONGOING,
  [_FundStatus.WITHDRAW]: CrowdloanParaState.FAILED,
  [_FundStatus.FAILED]: CrowdloanParaState.FAILED,
  [_FundStatus.WON]: CrowdloanParaState.COMPLETED
};

export type CrowdloanFundInfo = _CrowdloanFund & {
  chain: string;
}

function getChainInfoMap (chainInfoList: _ChainInfo[]): Record<string, _ChainInfo> {
  const result: Record<string, _ChainInfo> = {};

  chainInfoList.forEach((ci) => {
    if (ci.slug) {
      result[ci.slug] = ci;
    }
  });

  return result;
}

const getOnlineFundList = fetchStaticData<CrowdloanFundInfo[]>('crowdloan-funds');
const getOnlineChainInfoMap = (async () => {
  const chainInfoList = await fetchStaticData<_ChainInfo[]>('chains');

  return getChainInfoMap(chainInfoList);
})();

function getRPCCrowdloan (parentAPI: _SubstrateApi, fundInfo: _CrowdloanFund, hexAddresses: string[], callback: (rs: CrowdloanItem) => void) {
  const { auctionIndex, endTime, firstPeriod, fundId, lastPeriod, paraId, startTime, status } = fundInfo;
  const unsubPromise = parentAPI.api.derive.crowdloan.ownContributions(paraId, hexAddresses, (result: DeriveOwnContributions) => {
    let contribute = new BN(0);

    Object.values(result).forEach((item) => {
      contribute = contribute.add(item.toBn());
    });

    const rs: CrowdloanItem = {
      state: APIItemState.READY,
      paraState: STATUS_MAP[fundInfo.status],
      contribute: contribute.toString(),
      fundId,
      paraId,
      status,
      startTime,
      endTime,
      auctionIndex,
      firstPeriod,
      lastPeriod
    };

    callback(rs);
  });

  return () => {
    unsubPromise
      .then((unsub) => {
        unsub();
      })
      .catch(console.error);
  };
}

export const subscribeAcalaContributeInterval = (polkadotAddresses: string[], fundInfo: _CrowdloanFund, callback: (rs: CrowdloanItem) => void) => {
  const { auctionIndex, endTime, firstPeriod, fundId, lastPeriod, paraId, startTime, status } = fundInfo;
  const paraState = STATUS_MAP[fundInfo.status];
  const acalaContributionApi = 'https://api.polkawallet.io/acala-distribution-v2/crowdloan?account=';

  const getContributeInfo = () => {
    Promise.all(polkadotAddresses.map((polkadotAddress) => {
      return fetchJson(`${acalaContributionApi}${polkadotAddress}`);
    })).then((resList) => {
      let contribute = new BN(0);

      resList.forEach((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
        contribute = contribute.add(new BN(res.data.data?.acala?.[0]?.totalDOTLocked || '0'));
      });

      const rs: CrowdloanItem = {
        state: APIItemState.READY,
        paraState,
        contribute: contribute.toString(),
        fundId,
        paraId,
        status,
        startTime,
        endTime,
        auctionIndex,
        firstPeriod,
        lastPeriod
      };

      callback(rs);
    }).catch(console.error);
  };

  getContributeInfo();
  const interval = setInterval(getContributeInfo, ACALA_REFRESH_CROWDLOAN_INTERVAL);

  return () => {
    clearInterval(interval);
  };
};

// export async function getCrowdloanFundsStatus (api: ApiPromise) {
//   const leases = await api.query.slots.leases.keys<ParaId[]>();
//   const leasesParaIds = leases.map(({ args: [paraId] }) => paraId.toString());

//   const rs = await api.query.crowdloan.funds.entries<Option<any>, ParaId[]>();
//   const newRaise = await api.query.crowdloan.newRaise<Vec<u32>>();

//   const newRaiseParaIds = (newRaise.toJSON() as number[]).map((p) => p.toString());

//   return rs.reduce((stateMap, [{ args: [paraId] }, fundData]) => {
//     const paraStr = paraId.toString();
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//     // const item = fundData.unwrap() as PolkadotRuntimeCommonCrowdloanFundInfo;
//     if (leasesParaIds.indexOf(paraStr) > -1) {
//       stateMap[paraStr] = CrowdloanParaState.COMPLETED;
//     }
//     if (newRaiseParaIds.indexOf(paraStr) > -1) {
//       stateMap[paraStr] = CrowdloanParaState.ONGOING;
//     }
//     return stateMap;
//   }, {} as Record<string, CrowdloanParaState>);
// }

function isNeedToUpdateLatestFundInfoMap (latestMap: Record<string, CrowdloanFundInfo>, chainSlug: string, fundInfo: CrowdloanFundInfo) {
  if (!latestMap[chainSlug]) {
    return true;
  }

  if (!fundInfo.auctionIndex && fundInfo.status === _FundStatus.IN_AUCTION) {
    return true;
  }

  if (fundInfo.auctionIndex > latestMap[chainSlug].auctionIndex) {
    return true;
  }

  return false;
}

// Get All crowdloan
export async function subscribeCrowdloan (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, callback: (networkKey: string, rs: CrowdloanItem) => void) {
  const unsubMap: Record<string, any> = {};
  const latestMap: Record<string, CrowdloanFundInfo> = {};
  const rawFundList = await getOnlineFundList;
  const chainInfoMap = await getOnlineChainInfoMap;

  rawFundList.forEach((fundInfo) => {
    const chainSlug = fundInfo.chain;

    if (isNeedToUpdateLatestFundInfoMap(latestMap, chainSlug, fundInfo)) {
      latestMap[chainSlug] = fundInfo;
    }
  });

  if (Object.keys(substrateApiMap).includes(COMMON_CHAIN_SLUGS.KUSAMA) && Object.keys(substrateApiMap).includes(COMMON_CHAIN_SLUGS.POLKADOT)) {
    const now = Date.now();
    const polkadotAPI = await substrateApiMap[COMMON_CHAIN_SLUGS.POLKADOT].isReady;
    const kusamaAPI = await substrateApiMap[COMMON_CHAIN_SLUGS.KUSAMA].isReady;
    const substrateAddresses = categoryAddresses(addresses)[0];
    const hexAddresses = substrateAddresses.map((address) => {
      return registry.createType('AccountId', address).toHex();
    });

    if (addresses.length === 0) {
      return;
    }

    Object.values(latestMap).forEach((fundInfo) => {
      const chainSlug = fundInfo.chain;
      const endTime = new Date(fundInfo.endTime).getTime();
      const parentChain = fundInfo.relayChain;
      const substrateInfo = chainInfoMap[chainSlug]?.substrateInfo;

      if (chainSlug && parentChain && STATUS_MAP[fundInfo.status] && fundInfo.paraId && endTime > now && substrateInfo) {
        const crowdloanCb = (rs: CrowdloanItem) => {
          callback(chainSlug, rs);
        };

        fundInfo.paraId = substrateInfo.crowdloanParaId || substrateInfo.paraId || fundInfo.paraId;

        if (chainSlug === COMMON_CHAIN_SLUGS.ACALA) {
          const acalaAddresses = substrateAddresses.map((address) => reformatAddress(address, 10, false));

          unsubMap.acala = subscribeAcalaContributeInterval(acalaAddresses, fundInfo, crowdloanCb);
        } else if (parentChain === COMMON_CHAIN_SLUGS.POLKADOT) {
          unsubMap[chainSlug] = getRPCCrowdloan(polkadotAPI, fundInfo, hexAddresses, crowdloanCb);
        } else if (parentChain === COMMON_CHAIN_SLUGS.KUSAMA) {
          unsubMap[chainSlug] = getRPCCrowdloan(kusamaAPI, fundInfo, hexAddresses, crowdloanCb);
        }
      }
    });
  }

  return () => {
    Object.values(unsubMap).forEach((unsub) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      unsub && unsub();
    });
  };
}
