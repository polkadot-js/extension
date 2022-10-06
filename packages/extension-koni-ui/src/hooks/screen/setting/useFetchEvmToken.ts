// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomToken } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useFetchEvmToken (): CustomToken[] {
  const { customToken } = useSelector((state: RootState) => state);
  const filteredErc20Token: CustomToken[] = [];
  const filteredErc721Token: CustomToken[] = [];

  for (const token of customToken.erc20) {
    if (!token.isDeleted) {
      filteredErc20Token.push(token);
    }
  }

  for (const token of customToken.erc721) {
    if (!token.isDeleted) {
      filteredErc721Token.push(token);
    }
  }

  return [...filteredErc20Token, ...filteredErc721Token];
}
