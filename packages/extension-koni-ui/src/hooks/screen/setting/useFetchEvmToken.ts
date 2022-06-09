// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomEvmToken } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useFetchEvmToken (): CustomEvmToken[] {
  const { evmToken } = useSelector((state: RootState) => state);
  const filteredErc20Token: CustomEvmToken[] = [];
  const filteredErc721Token: CustomEvmToken[] = [];

  for (const token of evmToken.erc20) {
    if (!token.isDeleted) {
      filteredErc20Token.push(token);
    }
  }

  for (const token of evmToken.erc721) {
    if (!token.isDeleted) {
      filteredErc721Token.push(token);
    }
  }

  return [...filteredErc20Token, ...filteredErc721Token];
}
