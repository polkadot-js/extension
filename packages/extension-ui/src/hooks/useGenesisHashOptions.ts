// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useState } from 'react';

import { getAllMetatdata } from '../messaging';
import chains from '../util/chains';
import useTranslation from './useTranslation';

interface Option {
  text: string;
  value: string;
}

export default function (): Option[] {
  const { t } = useTranslation();
  const [metadataChains, setMetadatachains] = useState<Option[]>([]);

  useEffect(() => {
    getAllMetatdata().then((metadataDefs) => {
      const res = metadataDefs.map((metadata) => ({ text: metadata.chain, value: metadata.genesisHash }));

      setMetadatachains(res);
    }).catch(console.error);
  }, []);

  const hashes = useMemo(() => [
    {
      text: t('Allow use on any chain'),
      value: ''
    },
    ...chains.map(({ chain, genesisHash }) => ({
      text: chain,
      value: genesisHash
    })),
    ...metadataChains.filter(({ value }) => !chains.find(({ genesisHash }) => genesisHash === value))
  ], [metadataChains, t]);

  return hashes;
}
