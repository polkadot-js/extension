// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetWorkMetadataDef } from '@subwallet/extension-base/background/KoniTypes';
import useGetNetworkMetadata from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkMetadata';

function getCrowdloanNetworksMap (source: Record<string, NetWorkMetadataDef>): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  result.all = [];
  result.polkadot = [];
  result.kusama = [];

  for (const networkKey in source) {
    // eslint-disable-next-line no-prototype-builtins
    if (!source.hasOwnProperty(networkKey)) {
      continue;
    }

    const networkInfo = source[networkKey];

    // eslint-disable-next-line eqeqeq
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
  const crowdloanNetworksMap = getCrowdloanNetworksMap(networkMetadata);

  if (currentNetworkKey === 'all') {
    return [...crowdloanNetworksMap.all];
  }

  if (currentNetworkKey === 'polkadot') {
    return [...crowdloanNetworksMap.polkadot];
  }

  if (currentNetworkKey === 'kusama') {
    return [...crowdloanNetworksMap.kusama];
  }

  return [currentNetworkKey];
}

export default function useCrowdloanNetworks (currentNetworkKey: string): string[] {
  const networkMetadata = useGetNetworkMetadata();

  return getCrowdloanNetworks(networkMetadata, currentNetworkKey);
}
