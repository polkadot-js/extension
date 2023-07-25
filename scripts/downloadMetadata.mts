import { ApiPromise, WsProvider } from '@polkadot/api';
import { base64Encode } from '@polkadot/util-crypto';
import typesBundle from './typesBundle.mjs';
import { getSpecTypes } from '@polkadot/types-known';
import fs from 'fs/promises';

const chainSpecificMetadata = [
  {
    wsUrl: 'wss://ws.azero.dev',
  },
  {
    wsUrl: 'wss://ws.test.azero.dev',
  }
]


const getMetadataFromWsUrl = async ({ wsUrl, ...options }: typeof chainSpecificMetadata[number]) => {
  const api = await ApiPromise.create({ provider: new WsProvider(wsUrl), typesBundle });

  const chainName = await api.rpc.system.chain();

  /**
   * Equivalent of way the metadata is composed in the dashboard:
   * https://github.com/Cardinal-Cryptography/apps/blob/e55a18689bdc0866d0e75ff4076b596d8a90cd81/packages/page-settings/src/useChainInfo.ts#L17C8-L27
   */
  const metaData = {
    ...options,
    chain: chainName.toString(),
    chainType: 'substrate',
    color: '#00CCAB',
    genesisHash: api.genesisHash.toHex(),
    metaCalls: base64Encode(api.runtimeMetadata.asCallsOnly.toU8a()),
    specVersion: api.runtimeVersion.specVersion.toNumber(),
    ss58Format: api.registry.chainSS58,
    tokenDecimals: api.registry.chainDecimals[0],
    tokenSymbol: api.registry.chainTokens[0],
    types: getSpecTypes(api.registry, chainName, api.runtimeVersion.specName, api.runtimeVersion.specVersion),
    icon: 'substrate',
  };

  await api.disconnect();

  return metaData;
}

await Promise.all(chainSpecificMetadata.map(getMetadataFromWsUrl))
  .then(chainsMetadata =>
    fs.writeFile('./packages/extension/src/chains-metadata.json', JSON.stringify(chainsMetadata))
  );
