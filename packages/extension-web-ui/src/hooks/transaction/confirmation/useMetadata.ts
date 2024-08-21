// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@subwallet/extension-chains/types';

import { _ChainInfo } from '@subwallet/chain-list/types';
import { getMetadata, getMetadataRaw } from '@subwallet/extension-web-ui/messaging';
import { useEffect, useMemo, useState } from 'react';

import { useGetChainInfoByGenesisHash } from '../../chain';

interface Result {
  chain: Chain | null;
  loadingChain: boolean;
}

export default function useMetadata (genesisHash?: string | null, isPartial?: boolean): Result {
  const [chain, setChain] = useState<Chain | null>(null);
  const [loadingChain, setLoadingChain] = useState(true);
  const _chainInfo = useGetChainInfoByGenesisHash(genesisHash || '');
  const [chainInfo, setChainInfo] = useState<_ChainInfo | null>(_chainInfo);
  const chainString = useMemo(() => JSON.stringify(chainInfo), [chainInfo]);

  useEffect(() => {
    const updated = JSON.stringify(_chainInfo);

    if (updated !== chainString) {
      setChainInfo(_chainInfo);
    }
  }, [_chainInfo, chainString]);

  useEffect((): void => {
    setLoadingChain(true);

    if (genesisHash) {
      const getChainByMetaStore = () => {
        getMetadata(genesisHash, isPartial)
          .then(setChain)
          .catch((error): void => {
            console.error(error);
            setChain(null);
          })
          .finally(() => {
            setLoadingChain(false);
          });
      };

      getMetadataRaw(chainInfo, genesisHash)
        .then((chain) => {
          if (chain) {
            setChain(chain);
            setLoadingChain(false);
          } else {
            getChainByMetaStore();
          }
        })
        .catch((e) => {
          console.error(e);
          getChainByMetaStore();
        });
    } else {
      setLoadingChain(false);
      setChain(null);
    }
  }, [chainInfo, genesisHash, isPartial]);

  return useMemo(() => ({ chain, loadingChain }), [chain, loadingChain]);
}
