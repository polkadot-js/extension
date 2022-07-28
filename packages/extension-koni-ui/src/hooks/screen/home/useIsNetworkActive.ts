// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useIsNetworkActive (networkKey: string | undefined) {
  const { networkMap } = useSelector((state: RootState) => state);

  if (!networkKey) {
    return false;
  }

  return networkMap[networkKey].active;
}
