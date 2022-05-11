// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { CustomEvmToken } from '@polkadot/extension-base/background/KoniTypes';
import { RootState } from '@polkadot/extension-koni-ui/stores';

export default function useFetchEvmToken (): CustomEvmToken[] {
  const { evmToken } = useSelector((state: RootState) => state);

  return [...evmToken.erc20, ...evmToken.erc721];
}
