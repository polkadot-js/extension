// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@subwallet/extension-chains/types';

import { _ChainInfo } from '@subwallet/chain-list/types';
import { getMetadata, getMetadataRaw } from '@subwallet/extension-koni-ui/messaging';
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
      const getChainByMetaStore = async () => {
        try {
          const chain = await getMetadata(genesisHash, isPartial);

          return chain;
        } catch (error) {
          console.error(error);

          return null;
        }
      };

      const fetchData = async () => {
        try {
          const chainFromRaw = await getMetadataRaw(chainInfo, genesisHash);
          const chainFromMetaStore = await getChainByMetaStore();

          if (chainFromRaw && chainFromMetaStore) {
            if (chainFromRaw.specVersion >= chainFromMetaStore.specVersion) {
              setChain(chainFromRaw);
            } else {
              setChain(chainFromMetaStore);
            }

            setLoadingChain(false);
          } else {
            setChain(chainFromRaw || chainFromMetaStore || null);
            setLoadingChain(false);
          }
        } catch (error) {
          console.error(error);
          setChain(null);
          setLoadingChain(false);
        }
      };

      fetchData().catch((error) => {
        console.error(error);
        setChain(null);
        setLoadingChain(false);
      });
    } else {
      setLoadingChain(false);
      setChain(null);
    }
  }, [chainInfo, genesisHash, isPartial]);

  return useMemo(() => ({ chain, loadingChain }), [chain, loadingChain]);
}
