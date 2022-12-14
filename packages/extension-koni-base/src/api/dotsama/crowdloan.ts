// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState, ApiProps, CrowdloanItem, CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';
import registry from '@subwallet/extension-koni-base/api/dotsama/typeRegistry';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { ACALA_REFRESH_CROWDLOAN_INTERVAL } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, reformatAddress } from '@subwallet/extension-koni-base/utils';
import axios from 'axios';

import { ApiPromise } from '@polkadot/api';
import { DeriveOwnContributions } from '@polkadot/api-derive/types';
import { Option, u32, Vec } from '@polkadot/types';
import { ParaId } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

function getRPCCrowdloan (parentAPI: ApiProps, paraId: number, hexAddresses: string[], paraState: CrowdloanParaState, callback: (rs: CrowdloanItem) => void) {
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
        if (res.status !== 200) {
          console.warn('Failed to get Acala, Karura crowdloan contribute');
        }

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
export async function subscribeCrowdloan (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: CrowdloanItem) => void, networks = PREDEFINED_NETWORKS) {
  const unsubMap: Record<string, any> = {};

  if (dotSamaAPIMap.polkadot && dotSamaAPIMap.kusama) {
    const polkadotAPI = await dotSamaAPIMap.polkadot.isReady;
    const polkadotFundsStatusMap = await getCrowdloanFundsStatus(polkadotAPI.api);
    const kusamaAPI = await dotSamaAPIMap.kusama.isReady;
    const kusamaFundsStatusMap = await getCrowdloanFundsStatus(kusamaAPI.api);

    const substrateAddresses = categoryAddresses(addresses)[0];

    const hexAddresses = substrateAddresses.map((address) => {
      return registry.createType('AccountId', address).toHex();
    });

    Object.entries(networks).forEach(([networkKey, networkInfo]) => {
      const crowdloanCb = (rs: CrowdloanItem) => {
        callback(networkKey, rs);
      };

      const paraId = networkInfo.paraId;

      if (paraId === undefined || addresses.length === 0) {
        return;
      }

      if (networkKey === 'acala') {
        unsubMap.acala = subscribeAcalaContributeInterval(substrateAddresses.map((address) => reformatAddress(address, networkInfo.ss58Format, networkInfo.isEthereum)), polkadotFundsStatusMap[paraId], crowdloanCb);
      } else if (networkInfo.groups.includes('POLKADOT_PARACHAIN') && networkInfo.paraId && polkadotFundsStatusMap[paraId]) {
        unsubMap[networkKey] = getRPCCrowdloan(polkadotAPI, paraId, hexAddresses, polkadotFundsStatusMap[paraId], crowdloanCb);
      } else if (networkInfo.groups.includes('KUSAMA_PARACHAIN') && paraId && kusamaFundsStatusMap[paraId]) {
        unsubMap[networkKey] = getRPCCrowdloan(kusamaAPI, paraId, hexAddresses, kusamaFundsStatusMap[paraId], crowdloanCb);
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
