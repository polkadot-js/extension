// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { ResponseMetadataHash, ResponseShortenMetadata } from '@subwallet/extension-base/types';

import { getSpecExtensions, getSpecTypes } from '@polkadot/types-known';
import { HexString } from '@polkadot/util/types';

const LEDGER_API_URL = 'https://ledger-api.subwallet.app';

const createUrl = (path: string): string => `${LEDGER_API_URL}/${path}`;

export const _isRuntimeUpdated = (signedExtensions?: string[]): boolean => {
  return signedExtensions ? signedExtensions.includes('CheckMetadataHash') : false;
};

export const getMetadataHash = async (chain: string): Promise<string> => {
  const data = {
    id: chain
  };

  const resp = await fetch(createUrl('node/metadata/hash'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const rs = await resp.json() as ResponseMetadataHash;

  return rs.metadataHash;
};

export const getShortMetadata = async (chain: string, blob: string): Promise<string> => {
  const data = {
    chain: {
      id: chain
    },
    txBlob: blob
  };

  const resp = await fetch(createUrl('transaction/metadata'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const rs = await resp.json() as ResponseShortenMetadata;

  return rs.txMetadata;
};

export const cacheMetadata = (
  chain: string,
  substrateApi: _SubstrateApi,
  chainService?: ChainService
): void => {
  // Update metadata to database with async methods
  substrateApi.api.isReady.then(async (api) => {
    const currentSpecVersion = api.runtimeVersion.specVersion.toString();
    const genesisHash = api.genesisHash.toHex();
    const metadata = await chainService?.getMetadata(chain);

    // Avoid date existed metadata
    if (metadata && metadata.specVersion === currentSpecVersion && metadata.genesisHash === genesisHash) {
      return;
    }

    const systemChain = await api.rpc.system.chain();
    // const _metadata: Option<OpaqueMetadata> = await api.call.metadata.metadataAtVersion(15);
    // const metadataHex = _metadata.isSome ? _metadata.unwrap().toHex().slice(2) : ''; // Need unwrap to create metadata object
    let hexV15: HexString | undefined;

    const metadataV15 = await api.call.metadata.metadataAtVersion(15);

    if (!metadataV15.isEmpty) {
      hexV15 = metadataV15.unwrap().toHex();
    }

    chainService?.upsertMetadata(chain, {
      chain: chain,
      genesisHash: genesisHash,
      specVersion: currentSpecVersion,
      hexValue: api.runtimeMetadata.toHex(),
      types: getSpecTypes(api.registry, systemChain, api.runtimeVersion.specName, api.runtimeVersion.specVersion) as unknown as Record<string, string>,
      userExtensions: getSpecExtensions(api.registry, systemChain, api.runtimeVersion.specName),
      hexV15
    }).catch(console.error);
  }).catch(console.error);
};
