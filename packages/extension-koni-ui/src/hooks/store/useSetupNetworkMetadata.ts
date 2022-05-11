// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { NetWorkMetadataDef } from '@subwallet/extension-base/background/KoniTypes';
import { getAllNetworkMetadata } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';

function updateNetworkMetadata (metadataDefs: NetWorkMetadataDef[]): void {
  store.dispatch({ type: 'networkMetadata/update', payload: metadataDefs });
}

export default function useSetupNetworkMetadata (): void {
  useEffect(() => {
    console.log('--- Setup redux: networkMetadata');
    getAllNetworkMetadata().then((metadataDefs) => {
      updateNetworkMetadata(metadataDefs);
    }).catch(console.error);
  }, []);
}
