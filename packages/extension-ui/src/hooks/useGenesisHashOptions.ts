// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useRef } from 'react';

import chains from '../util/chains';
import useTranslation from './useTranslation';

interface Option {
  text: string;
  value: string;
}

export default function (): Option[] {
  const { t } = useTranslation();

  const { current: hashes } = useRef([
    {
      text: t('Allow use on any chain'),
      value: ''
    },
    ...chains.map(({ chain, genesisHash }) => ({
      text: chain,
      value: genesisHash
    }))
  ]);

  return hashes;
}
