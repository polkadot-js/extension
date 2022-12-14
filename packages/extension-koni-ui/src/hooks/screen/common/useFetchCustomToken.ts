// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomToken } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useFetchCustomToken (): CustomToken[] {
  const customToken = useSelector((state: RootState) => state.customToken);
  const filteredCustomTokens: CustomToken[] = [];

  Object.values(customToken).forEach((_tokenList) => { // beware of too many loops
    const tokenList = _tokenList as CustomToken[];

    for (const token of tokenList) {
      if (!token.isDeleted) {
        filteredCustomTokens.push(token);
      }
    }
  });

  return filteredCustomTokens;
}
