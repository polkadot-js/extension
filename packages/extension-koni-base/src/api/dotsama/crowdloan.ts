// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { DeriveOwnContributions } from '@polkadot/api-derive/types';
import { APIItemState, ApiProps, CrowdloanItem } from '@polkadot/extension-base/background/KoniTypes';
import registry from '@polkadot/extension-koni-base/api/dotsama/typeRegistry';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { ACALA_REFRESH_CROWDLOAN_INTERVAL } from '@polkadot/extension-koni-base/constants';
import { reformatAddress } from '@polkadot/extension-koni-base/utils/utils';

function getRPCCrowndloan (parentAPI: ApiProps, paraId: number, hexAddress: string, callback: (rs: CrowdloanItem) => void) {
  const unsubPromise = parentAPI.api.derive.crowdloan.ownContributions(paraId, [hexAddress], (result: DeriveOwnContributions) => {
    const rs: CrowdloanItem = {
      state: APIItemState.READY,
      contribute: result[hexAddress]?.toString() || '0'
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

export const subcribleAcalaContributeInterval = (polkadotAddress: string, callback: (rs: CrowdloanItem) => void) => {
  const acalaContributionApi = 'https://api.polkawallet.io/acala-distribution-v2/crowdloan?account=';

  const getContributeInfo = () => {
    axios.get(`${acalaContributionApi}${polkadotAddress}`)
      .then((res) => {
        if (res.status !== 200) {
          console.warn('Failed to get Acala crowdloan contribute');
        }

        const rs: CrowdloanItem = {
          state: APIItemState.READY,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          contribute: res.data.data?.acala?.[0]?.detail?.lcAmount || '0'
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

// Get All crowdloan
export async function subcribeCrowdloan (address: string, dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: CrowdloanItem) => void, networks = NETWORKS) {
  const polkadotAPI = await dotSamaAPIMap.polkadot.isReady;
  const kusamaAPI = await dotSamaAPIMap.kusama.isReady;
  const unsubMap: Record<string, any> = {};
  const hexAddress = registry.createType('AccountId', address).toHex();

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    const crowdloanCb = (rs: CrowdloanItem) => {
      callback(networkKey, rs);
    };

    if (networkInfo.paraId === undefined) {
      return;
    }

    if (networkKey === 'acala') {
      unsubMap.acala = subcribleAcalaContributeInterval(reformatAddress(address, networkInfo.ss58Format, networkInfo.isEthereum), crowdloanCb);
    } else if (networkInfo.group === 'POLKADOT_PARACHAIN') {
      unsubMap[networkKey] = getRPCCrowndloan(polkadotAPI, networkInfo.paraId, hexAddress, crowdloanCb);
    } else if (networkInfo.group === 'KUSAMA_PARACHAIN') {
      unsubMap[networkKey] = getRPCCrowndloan(kusamaAPI, networkInfo.paraId, hexAddress, crowdloanCb);
    }
  });

  return unsubMap;
}
