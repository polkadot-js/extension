// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

import { DeriveOwnContributions } from '@polkadot/api-derive/types';
import { APIItemState, ApiProps, CrowdloanItem } from '@polkadot/extension-base/background/KoniTypes';
import registry from '@polkadot/extension-koni-base/api/dotsama/typeRegistry';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { ACALA_REFRESH_CROWDLOAN_INTERVAL } from '@polkadot/extension-koni-base/constants';
import { categoryAddresses, reformatAddress } from '@polkadot/extension-koni-base/utils/utils';
import { BN } from '@polkadot/util';

function getRPCCrowndloan (parentAPI: ApiProps, paraId: number, hexAddresses: string[], callback: (rs: CrowdloanItem) => void) {
  const unsubPromise = parentAPI.api.derive.crowdloan.ownContributions(paraId, hexAddresses, (result: DeriveOwnContributions) => {
    let contribute = new BN(0);

    Object.values(result).forEach((item) => {
      contribute = contribute.add(item.toBn());
    });

    const rs: CrowdloanItem = {
      state: APIItemState.READY,
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

export const subcribleAcalaContributeInterval = (networkKey: string, polkadotAddresses: string[], callback: (rs: CrowdloanItem) => void) => {
  const acalaContributionApi = 'https://api.polkawallet.io/acala-distribution-v2/crowdloan?account=';

  const getContributeInfo = () => {
    let contribute = new BN(0);

    polkadotAddresses.forEach((polkadotAddress) => {
      axios.get(`${acalaContributionApi}${polkadotAddress}`)
        .then((response) => {
          if (response.status !== 200) {
            console.warn('Failed to get Acala crowdloan contribute');
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
          contribute = contribute.add(new BN(response.data.data?.[networkKey]?.[0]?.detail?.lcAmount || '0'));

          const rs: CrowdloanItem = {
            state: APIItemState.READY,
            contribute: contribute.toString()
          };

          callback(rs);
        })
        .catch(console.error);
    });
  };

  getContributeInfo();
  const interval = setInterval(getContributeInfo, ACALA_REFRESH_CROWDLOAN_INTERVAL);

  return () => {
    clearInterval(interval);
  };
};

// Get All crowdloan
export async function subscribeCrowdloan (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: CrowdloanItem) => void, networks = NETWORKS) {
  const polkadotAPI = await dotSamaAPIMap.polkadot.isReady;
  const kusamaAPI = await dotSamaAPIMap.kusama.isReady;
  const unsubMap: Record<string, any> = {};

  const substrateAddresses = categoryAddresses(addresses)[0];

  const hexAddresses = substrateAddresses.map((address) => {
    return registry.createType('AccountId', address).toHex();
  });

  Object.entries(networks).forEach(([networkKey, networkInfo]) => {
    const crowdloanCb = (rs: CrowdloanItem) => {
      callback(networkKey, rs);
    };

    if (networkInfo.paraId === undefined || addresses.length === 0) {
      return;
    }

    if (networkKey === 'acala' || networkKey === 'karura') {
      unsubMap.acala = subcribleAcalaContributeInterval(networkKey, substrateAddresses.map((address) => reformatAddress(address, networkInfo.ss58Format, networkInfo.isEthereum)), crowdloanCb);
    } else if (networkInfo.groups.includes('POLKADOT_PARACHAIN')) {
      unsubMap[networkKey] = getRPCCrowndloan(polkadotAPI, networkInfo.paraId, hexAddresses, crowdloanCb);
    } else if (networkInfo.groups.includes('KUSAMA_PARACHAIN')) {
      unsubMap[networkKey] = getRPCCrowndloan(kusamaAPI, networkInfo.paraId, hexAddresses, crowdloanCb);
    }
  });

  return unsubMap;
}
