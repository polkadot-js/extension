// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomEvmToken } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useFetchEvmToken (): CustomEvmToken[] {
  const { evmToken } = useSelector((state: RootState) => state);

  return [...evmToken.erc20, ...evmToken.erc721];
}
