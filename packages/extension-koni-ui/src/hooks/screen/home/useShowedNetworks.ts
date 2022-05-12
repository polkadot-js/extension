// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import useGenesisHashOptions, { NetworkSelectOption } from '@subwallet/extension-koni-ui/hooks/useGenesisHashOptions';
import { getGenesisOptionsByAddressType } from '@subwallet/extension-koni-ui/util';

function getShowedNetworks (genesisOptions: NetworkSelectOption[], networkKey: string): string[] {
  if (networkKey === 'all') {
    return genesisOptions.filter((i) => (i.networkKey) && (i.networkKey !== 'all')).map((i) => i.networkKey);
  }

  return [networkKey];
}

export default function useShowedNetworks (currentNetworkKey: string, address: string, accounts: AccountJson[]): string[] {
  const genesisOptions = getGenesisOptionsByAddressType(address, accounts, useGenesisHashOptions());

  return getShowedNetworks(genesisOptions, currentNetworkKey);
}
