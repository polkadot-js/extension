// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import chains from '../util/chains';
import useTranslation from './useTranslation';

interface Option {
  text: string;
  value: string;
}

export default function (): Option[] {
  const { t } = useTranslation();

  const hashes = useMemo(() => [
    {
      text: t('Allow use on any chain'),
      value: ''
    },
    ...chains.map(({ chain, genesisHash }) => ({
      text: chain,
      value: genesisHash
    }))
  ], [t]);

  return hashes;
}
