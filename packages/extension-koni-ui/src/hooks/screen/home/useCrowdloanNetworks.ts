// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { NetWorkMetadataDef } from '@polkadot/extension-base/background/KoniTypes';
import { RootState } from '@polkadot/extension-koni-ui/stores';

function getCrowdloadNetworksMap (source: Record<string, NetWorkMetadataDef>): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  result.all = [];
  result.polkadot = [];
  result.kusama = [];

  for (const networkKey in source) {
    if (!source.hasOwnProperty(networkKey)) {
      continue;
    }

    const networkInfo = source[networkKey];

    if (networkInfo.paraId == undefined) {
      continue;
    }

    result.all.push(networkKey);

    if (networkInfo.groups.includes('POLKADOT_PARACHAIN')) {
      result.polkadot.push(networkKey);
    } else if (networkInfo.groups.includes('KUSAMA_PARACHAIN')) {
      result.kusama.push(networkKey);
    }
  }

  return result;
}

function getCrowdloanNetworks (networkMetadata: Record<string, NetWorkMetadataDef>, currentNetworkKey: string): string[] {
  const crowdloadNetworksMap = getCrowdloadNetworksMap(networkMetadata);

  if (currentNetworkKey === 'all') {
    return [...crowdloadNetworksMap.all];
  }

  if (currentNetworkKey === 'polkadot') {
    return [...crowdloadNetworksMap.polkadot];
  }

  if (currentNetworkKey === 'kusama') {
    return [...crowdloadNetworksMap.kusama];
  }

  return [currentNetworkKey];
}

export default function useCrowdloanNetworks (currentNetworkKey: string): string[] {
  const networkMetadata = useSelector((state: RootState) => state.networkMetadata);

  return getCrowdloanNetworks(networkMetadata, currentNetworkKey);
}
