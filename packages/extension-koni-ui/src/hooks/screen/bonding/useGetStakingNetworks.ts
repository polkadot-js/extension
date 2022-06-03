// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useGetStakingNetworks () {
  const { networkMap } = useSelector((state: RootState) => state);
}
