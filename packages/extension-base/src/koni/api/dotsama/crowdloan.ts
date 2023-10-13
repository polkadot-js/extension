// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, CrowdloanItem, CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';
import { ACALA_REFRESH_CROWDLOAN_INTERVAL } from '@subwallet/extension-base/constants';
import registry from '@subwallet/extension-base/koni/api/dotsama/typeRegistry';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainSubstrateAddressPrefix, _getSubstrateParaId, _getSubstrateRelayParent, _isChainEvmCompatible, _isSubstrateParaChain } from '@subwallet/extension-base/services/chain-service/utils';
import { categoryAddresses, reformatAddress } from '@subwallet/extension-base/utils';
import axios from 'axios';

import { ApiPromise } from '@polkadot/api';
import { DeriveOwnContributions } from '@polkadot/api-derive/types';
import { Option, u32, Vec } from '@polkadot/types';
import { ParaId } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

const getOnlineChainList = (async () => {
  const request = await axios.get<_ChainInfo[]>('https://static-data.subwallet.app/chains/list.json');

  return request.data;
})();

function getRPCCrowdloan (parentAPI: _SubstrateApi, paraId: number, hexAddresses: string[], paraState: CrowdloanParaState, callback: (rs: CrowdloanItem) => void) {
  const unsubPromise = parentAPI.api.derive.crowdloan.ownContributions(paraId, hexAddresses, (result: DeriveOwnContributions) => {
    let contribute = new BN(0);

    Object.values(result).forEach((item) => {
      contribute = contribute.add(item.toBn());
    });

    const rs: CrowdloanItem = {
      state: APIItemState.READY,
      paraState,
      contribute: contribute.toString()
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

export const subscribeAcalaContributeInterval = (polkadotAddresses: string[], paraState: CrowdloanParaState, callback: (rs: CrowdloanItem) => void) => {
  const acalaContributionApi = 'https://api.polkawallet.io/acala-distribution-v2/crowdloan?account=';

  const getContributeInfo = () => {
    Promise.all(polkadotAddresses.map((polkadotAddress) => {
      return axios.get(`${acalaContributionApi}${polkadotAddress}`);
    })).then((resList) => {
      let contribute = new BN(0);

      resList.forEach((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
        contribute = contribute.add(new BN(res.data.data?.acala?.[0]?.totalDOTLocked || '0'));
      });

      const rs: CrowdloanItem = {
        state: APIItemState.READY,
        paraState,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        contribute: contribute.toString()
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

export async function getCrowdloanFundsStatus (api: ApiPromise) {
  const leases = await api.query.slots.leases.keys<ParaId[]>();
  const leasesParaIds = leases.map(({ args: [paraId] }) => paraId.toString());

  const rs = await api.query.crowdloan.funds.entries<Option<any>, ParaId[]>();
  const newRaise = await api.query.crowdloan.newRaise<Vec<u32>>();

  const newRaiseParaIds = (newRaise.toJSON() as number[]).map((p) => p.toString());

  return rs.reduce((stateMap, [{ args: [paraId] }, fundData]) => {
    const paraStr = paraId.toString();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // const item = fundData.unwrap() as PolkadotRuntimeCommonCrowdloanFundInfo;

    if (leasesParaIds.indexOf(paraStr) > -1) {
      stateMap[paraStr] = CrowdloanParaState.COMPLETED;
    }

    if (newRaiseParaIds.indexOf(paraStr) > -1) {
      stateMap[paraStr] = CrowdloanParaState.ONGOING;
    }

    return stateMap;
  }, {} as Record<string, CrowdloanParaState>);
}

// Get All crowdloan
export async function subscribeCrowdloan (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, callback: (networkKey: string, rs: CrowdloanItem) => void, chainInfoMap: Record<string, _ChainInfo>) {
  const unsubMap: Record<string, any> = {};
  const chainList = await getOnlineChainList;

  if (Object.keys(substrateApiMap).includes(COMMON_CHAIN_SLUGS.KUSAMA) && Object.keys(substrateApiMap).includes(COMMON_CHAIN_SLUGS.POLKADOT)) {
    const polkadotAPI = await substrateApiMap[COMMON_CHAIN_SLUGS.POLKADOT].isReady;
    const polkadotFundsStatusMap = await getCrowdloanFundsStatus(polkadotAPI.api);
    const kusamaAPI = await substrateApiMap[COMMON_CHAIN_SLUGS.KUSAMA].isReady;
    const kusamaFundsStatusMap = await getCrowdloanFundsStatus(kusamaAPI.api);

    // TODO: find all crowdloan valid networks: parachains, in-crowdloan, crowdloan but failed

    const substrateAddresses = categoryAddresses(addresses)[0];

    const hexAddresses = substrateAddresses.map((address) => {
      return registry.createType('AccountId', address).toHex();
    });

    chainList.forEach((chainInfo) => {
      const networkKey = chainInfo.slug;

      if (_isSubstrateParaChain(chainInfo)) {
        const parentChain = _getSubstrateRelayParent(chainInfo);

        const crowdloanCb = (rs: CrowdloanItem) => {
          callback(networkKey, rs);
        };

        const paraId = (chainInfo.substrateInfo?.crowdloanParaId || chainInfo.substrateInfo?.paraId || 0) as number;

        if (!paraId || addresses.length === 0 || parentChain.length === 0) {
          return;
        }

        console.log(networkKey, paraId);

        if (networkKey === COMMON_CHAIN_SLUGS.ACALA) {
          const acalaAddresses = substrateAddresses.map((address) => reformatAddress(address, _getChainSubstrateAddressPrefix(chainInfo), _isChainEvmCompatible(chainInfo)));

          unsubMap.acala = subscribeAcalaContributeInterval(acalaAddresses, CrowdloanParaState.COMPLETED, crowdloanCb);
        } else if (parentChain === COMMON_CHAIN_SLUGS.POLKADOT && polkadotFundsStatusMap[paraId]) {
          unsubMap[networkKey] = getRPCCrowdloan(polkadotAPI, paraId, hexAddresses, polkadotFundsStatusMap[paraId], crowdloanCb);
        } else if (parentChain === COMMON_CHAIN_SLUGS.KUSAMA && kusamaFundsStatusMap[paraId]) {
          unsubMap[networkKey] = getRPCCrowdloan(kusamaAPI, paraId, hexAddresses, kusamaFundsStatusMap[paraId], crowdloanCb);
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
