// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { NftCollection } from '@polkadot/extension-base/background/KoniTypes';
import { RootState } from '@polkadot/extension-koni-ui/stores';

export default function useFetchNftExtra (isShown: boolean): NftCollection | undefined {
  const { transferNftExtra } = useSelector((state: RootState) => state);

  if (!isShown) return transferNftExtra.selectedNftCollection;

  return undefined;
}
