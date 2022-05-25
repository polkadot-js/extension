// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useGetNetworkJson (networkKey: string) {
  const { networkMap } = useSelector((state: RootState) => state);

  return networkMap[networkKey];
}
