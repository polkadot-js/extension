// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

import { NetWorkMetadataDef } from '@polkadot/extension-base/background/KoniTypes';
import { getAllNetworkMetadata } from '@polkadot/extension-koni-ui/messaging';
import { store } from '@polkadot/extension-koni-ui/stores';

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
