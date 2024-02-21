// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainAssetMap, ChainInfoMap } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset, _ChainStatus } from '@subwallet/chain-list/types';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/tokens/evm/web3';
import { getDefaultWeightV2 } from '@subwallet/extension-base/koni/api/tokens/wasm/utils';
import { _PSP22_ABI } from '@subwallet/extension-base/services/chain-service/helper';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import BigN from 'bignumber.js';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { BN } from '@polkadot/util';

import { evmHandleConnectChain, substrateHandleConnectChain } from './base';

jest.setTimeout(3 * 60 * 60 * 1000);

interface AssetSpec {
  minAmount: string;
  symbol: string;
  decimals: number;
}

interface AssetPalletMetadata {
  deposit: number;
  name: string;
  symbol: string;
  decimals: number;
}

interface AssetPalletInfo {
  deposit: number;
  minBalance: number;
}

interface AssetRegistryWithChainInfoPalletMetadata {
  name: string;
  symbol: string;
  decimals: number;
  minimalBalance: number;
}

interface AssetRegistryWithChainInfoPalletMetadataV3 {
  decimals: number;
  name: string;
  symbol: string;
  existentialDeposit: number;
  location: object | undefined;
  additional: object | undefined;
}

interface OrmlAssetRegistryPalletMetadata {
  decimals: number;
  name: string;
  symbol: string;
  existentialDeposit: number;
  location: object | undefined;
  additional: object | undefined;
}

interface AssetManagerWithChainInfoPalletMetadata {
  name: string;
  symbol: string;
  decimals: number;
  minimalBalance: number;
}

interface AssetRegistryWithAssetIdPalletMetadata {
  symbol: string;
  decimals: number;
}

interface AssetRegistryWithAssetIdPalletInfo {
  name: string;
  existentialDeposit: number;
}

interface AssetManagerWithAssetIdPalletMetadata {
  metadata: {
    name: string;
    symbol: string;
    decimals: number;
  };
  minBalance: number;
}

interface EvmChainInfo {
  name: string;
  chain: string;
  icon: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  },
  infoURL: string;
  shortName: string;
  chainId: number;
  networkId: number;
  slip44: number;
}

const getByAssetPallet = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const [_info, _metadata] = await api.queryMulti([
    [api.query.assets.asset, _getTokenOnChainAssetId(asset)],
    [api.query.assets.metadata, _getTokenOnChainAssetId(asset)]
  ]);

  const info = _info.toPrimitive() as unknown as AssetPalletInfo;
  const metadata = _metadata.toPrimitive() as unknown as AssetPalletMetadata;

  return {
    decimals: metadata.decimals,
    minAmount: info.minBalance.toString(),
    symbol: metadata.symbol
  };
};

const getByAssetRegistryWithChainInfoPallet = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const raw = _getTokenOnChainInfo(asset);
  let data;

  if ('ForeignAsset' in raw) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data = { ForeignAssetId: raw.ForeignAsset };
  } else if ('Erc20' in raw) {
    data = raw;
  } else if ('StableAssetPoolToken' in raw) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data = { StableAssetId: raw.StableAssetPoolToken };
  } else {
    data = { NativeAssetId: raw };
  }

  const _metadata = await api.query.assetRegistry.assetMetadatas(data);

  const metadata = _metadata.toPrimitive() as unknown as AssetRegistryWithChainInfoPalletMetadata;

  return {
    decimals: metadata.decimals,
    minAmount: metadata.minimalBalance.toString(),
    symbol: metadata.symbol
  };
};

const getByAssetRegistryWithChainInfoPalletV2 = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const data = _getTokenOnChainInfo(asset);

  const _metadata = await api.query.assetRegistry.currencyMetadatas(data);

  const metadata = _metadata.toPrimitive() as unknown as AssetRegistryWithChainInfoPalletMetadata;

  return {
    decimals: metadata.decimals,
    minAmount: metadata.minimalBalance.toString(),
    symbol: metadata.symbol
  };
};

const getByAssetRegistryWithChainInfoPalletV3 = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const data = _getTokenOnChainInfo(asset);

  const _metadata = await api.query.assetRegistry.metadata(data);

  const metadata = _metadata.toPrimitive() as unknown as AssetRegistryWithChainInfoPalletMetadataV3;

  return {
    decimals: metadata.decimals,
    minAmount: metadata.existentialDeposit.toString(),
    symbol: metadata.symbol
  };
};

const getByOrmlAssetRegistryPallet = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const data = _getTokenOnChainInfo(asset);

  const _metadata = await api.query.ormlAssetRegistry.metadata(data);

  const metadata = _metadata.toPrimitive() as unknown as OrmlAssetRegistryPalletMetadata;

  return {
    decimals: metadata.decimals,
    minAmount: metadata.existentialDeposit.toString(),
    symbol: metadata.symbol
  };
};

const getByAssetManagerWithChainInfoPallet = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const raw = _getTokenOnChainInfo(asset);
  let data;

  if ('ForeignAsset' in raw) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data = { ForeignAssetId: raw.ForeignAsset };
  } else if ('Erc20' in raw) {
    data = raw;
  } else {
    data = { NativeAssetId: raw };
  }

  const _metadata = await api.query.assetManager.assetMetadatas(data);

  const metadata = _metadata.toPrimitive() as unknown as AssetManagerWithChainInfoPalletMetadata;

  return {
    decimals: metadata.decimals,
    minAmount: metadata.minimalBalance.toString(),
    symbol: metadata.symbol
  };
};

const getByAssetManagerWithAssetIdPallet = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const _metadata = await api.query.assetManager.assetIdMetadata(_getTokenOnChainAssetId(asset));

  const metadata = _metadata.toPrimitive() as unknown as AssetManagerWithAssetIdPalletMetadata;

  return {
    decimals: metadata.metadata.decimals,
    minAmount: metadata.minBalance.toString(),
    symbol: metadata.metadata.symbol
  };
};

const getByAssetRegistryWithAssetIdPallet = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const [_info, _metadata] = await api.queryMulti([
    [api.query.assetRegistry.assets, _getTokenOnChainAssetId(asset)],
    [api.query.assetRegistry.assetMetadataMap, _getTokenOnChainAssetId(asset)]
  ]);

  const info = _info.toPrimitive() as unknown as AssetRegistryWithAssetIdPalletInfo;
  const metadata = _metadata.toPrimitive() as unknown as AssetRegistryWithAssetIdPalletMetadata;

  return {
    decimals: metadata.decimals,
    minAmount: info.existentialDeposit.toString(),
    symbol: metadata.symbol
  };
};

const getLocalAssetInfo = async (chain: string, asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  if (['astar', 'shiden', 'shibuya', 'statemint', 'statemine', 'moonbeam', 'moonbase', 'moonriver', 'parallel', 'pangolin', 'darwinia2', 'crabParachain'].includes(chain)) {
    return getByAssetPallet(asset, api);
  } else if (['pioneer', 'bitcountry'].includes(chain)) {
    return getByAssetManagerWithChainInfoPallet(asset, api);
  } else if (['acala', 'karura', 'acala_testnet'].includes(chain)) {
    return getByAssetRegistryWithChainInfoPallet(asset, api);
  } else if (['bifrost', 'bifrost_dot', 'bifrost_testnet'].includes(chain)) {
    return getByAssetRegistryWithChainInfoPalletV2(asset, api);
  } else if (['hydradx_main'].includes(chain)) {
    return getByAssetRegistryWithAssetIdPallet(asset, api);
  } else if (['calamari', 'manta_network'].includes(chain)) {
    return getByAssetManagerWithAssetIdPallet(asset, api);
  } else if (['amplitude', 'pendulum'].includes(chain)) {
    return getByAssetRegistryWithChainInfoPalletV3(asset, api);
  } else if (['centrifuge'].includes(chain)) {
    return getByOrmlAssetRegistryPallet(asset, api);
  }

  throw new Error('Fail to get info');
};

// eslint-disable-next-line @typescript-eslint/require-await
const getSubstrateNativeInfo = async (api: ApiPromise): Promise<AssetSpec> => {
  const minAmount = api.consts.balances ? api.consts.balances.existentialDeposit.toString() : api.consts.eqBalances.existentialDeposit.toString();
  const symbol = api.registry.chainTokens[0];
  const decimals = api.registry.chainDecimals[0];

  return {
    decimals,
    minAmount,
    symbol
  };
};

const getPsp22AssetInfo = async (asset: _ChainAsset, api: ApiPromise): Promise<AssetSpec> => {
  const contractAddress = _getContractAddressOfToken(asset);
  const tokenContract = new ContractPromise(api, _PSP22_ABI, contractAddress);

  const [nameResp, symbolResp, decimalsResp] = await Promise.all([
    tokenContract.query['psp22Metadata::tokenName'](contractAddress, { gasLimit: getDefaultWeightV2(api) }), // read-only operation so no gas limit
    tokenContract.query['psp22Metadata::tokenSymbol'](contractAddress, { gasLimit: getDefaultWeightV2(api) }),
    tokenContract.query['psp22Metadata::tokenDecimals'](contractAddress, { gasLimit: getDefaultWeightV2(api) })
  ]);

  if (!(nameResp.result.isOk && symbolResp.result.isOk && decimalsResp.result.isOk) || !nameResp.output || !decimalsResp.output || !symbolResp.output) {
    return {
      decimals: -1,
      symbol: '',
      minAmount: '0'
    };
  } else {
    const symbolObj = symbolResp.output?.toHuman() as Record<string, any>;
    const decimalsObj = decimalsResp.output?.toHuman() as Record<string, any>;
    const nameObj = nameResp.output?.toHuman() as Record<string, any>;

    const name = nameResp.output ? (nameObj.Ok as string || nameObj.ok as string) : '';
    const decimals = decimalsResp.output ? (new BN((decimalsObj.Ok || decimalsObj.ok) as string | number)).toNumber() : 0;
    const symbol = decimalsResp.output ? (symbolObj.Ok as string || symbolObj.ok as string) : '';

    if (!name || !symbol || typeof name === 'object' || typeof symbol === 'object') {
      return {
        decimals: -1,
        symbol: '',
        minAmount: '0'
      };
    }

    return {
      decimals: decimals,
      symbol: symbol,
      minAmount: '0'
    };
  }
};

const getEvmNativeInfo = async (api: _EvmApi): Promise<AssetSpec> => {
  const chainId = await api.api.eth.getChainId();

  const fetchData = () => {
    return new Promise<EvmChainInfo | undefined>((resolve, reject) => {
      fetch('https://chainid.network/chains.json')
        .then((res) => {
          return res.json();
        })
        .then((json: EvmChainInfo[]) => {
          const rs = json.find((i) => i.chainId === chainId);

          resolve(rs);
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const data = await fetchData();

  if (data) {
    return {
      decimals: data.nativeCurrency.decimals,
      symbol: data.nativeCurrency.symbol,
      minAmount: '0'
    };
  }

  throw new Error('Cannot get info');
};

const getErc20AssetInfo = async (asset: _ChainAsset, api: _EvmApi): Promise<AssetSpec> => {
  const contractAddress = _getContractAddressOfToken(asset);
  const tokenContract = getERC20Contract('chain', contractAddress, { chain: api });

  const [_decimals, _symbol, _name] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    tokenContract.methods.decimals().call() as number,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    tokenContract.methods.symbol().call() as string,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    tokenContract.methods.name().call() as string
  ]);

  const name = _name;
  const decimals = new BigN(_decimals).toNumber();
  const symbol = _symbol;

  if (!name || !symbol || typeof name === 'object' || typeof symbol === 'object') {
    return {
      decimals: -1,
      symbol: '',
      minAmount: '0'
    };
  }

  return {
    decimals: decimals,
    symbol: symbol,
    minAmount: '0'
  };
};

const assetProvider: Record<string, number> = {
  default: 0,
  polkadot: 4,
  kusama: 4
};

const assetProviderBackup: Record<string, number> = {
  default: 1
};

const ignoreChains: string[] = ['interlay', 'kintsugi'];

describe('test chain asset', () => {
  it('chain asset', async () => {
    const chainAssets = Object.values(ChainAssetMap).filter((info) =>
      ChainInfoMap[info.originChain].chainStatus === _ChainStatus.ACTIVE &&
      !ignoreChains.includes(info.originChain)
    );
    const assetByChain: Record<string, _ChainAsset[]> = {};
    const errorChain: Record<string, string> = {};
    const errorAsset: Record<string, Record<string, string>> = {};
    const localTokenChain: Record<string, string[]> = {};

    for (const chainAsset of chainAssets) {
      const originChain = chainAsset.originChain;

      if (assetByChain[originChain]) {
        assetByChain[originChain].push(chainAsset);
      } else {
        assetByChain[originChain] = [chainAsset];
      }
    }

    for (const [chain, assets] of Object.entries(assetByChain)) {
      const localToken: string[] = [];

      for (const asset of assets) {
        if (asset.assetType === _AssetType.LOCAL) {
          localToken.push(asset.slug);
        }
      }

      if (localToken.length) {
        localTokenChain[chain] = localToken;
      }
    }

    for (const [chain, assets] of Object.entries(assetByChain)) {
      console.log('start', chain);
      const chainInfo = ChainInfoMap[chain];
      const providerIndex = assetProvider[chain] || assetProvider.default;
      const [key, provider] = Object.entries(chainInfo.providers)[providerIndex];

      if (chainInfo.substrateInfo) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        await new Promise<void>(async (resolve) => {
          const timeHandler = (chain: string) => {
            errorChain[chain] = 'Timeout';

            resolve();
          };

          const timeout = setTimeout(() => {
            timeHandler(chain);
          }, 2 * 60 * 1000);
          const [api, message] = await substrateHandleConnectChain(chain, key, provider, '');

          if (message) {
            errorChain[chain] = message;
            await api?.disconnect();
            resolve();
          }

          const tmpErrorAsset: Record<string, string> = {};
          const localToken: string[] = [];

          for (const asset of assets) {
            let assetInfo: AssetSpec | undefined;
            const errors: string[] = [];

            try {
              if (asset.assetType === _AssetType.NATIVE) {
                assetInfo = await getSubstrateNativeInfo(api);
              } else if (asset.assetType === _AssetType.LOCAL) {
                assetInfo = await getLocalAssetInfo(chain, asset, api);

                if (['moonbeam', 'moonriver', 'moonbase'].includes(chain)) {
                  const assetId = new BigN(_getTokenOnChainAssetId(asset));
                  const address = _getContractAddressOfToken(asset);
                  const calcAddress = '0xFFFFFFFF' + assetId.toString(16);

                  if (address.toLocaleLowerCase() !== calcAddress.toLocaleLowerCase()) {
                    errors.push(`Wrong contract address: current - ${address}, onChain - ${calcAddress}`);
                  }
                }
              } else if (asset.assetType === _AssetType.PSP22) {
                assetInfo = await getPsp22AssetInfo(asset, api);
              } else if ([_AssetType.ERC721, _AssetType.ERC20, _AssetType.UNKNOWN, _AssetType.PSP34].includes(asset.assetType)) {
                continue;
              }

              if (assetInfo) {
                const { decimals, minAmount, symbol } = assetInfo;

                if (minAmount !== asset.minAmount) {
                  errors.push(`Wrong min amount: current - ${asset.minAmount || 'null'}, onChain - ${minAmount}`);
                }

                if (symbol !== asset.symbol) {
                  const zkSymbol = 'zk' + symbol;

                  if (zkSymbol !== asset.symbol) {
                    errors.push(`Wrong symbol: current - ${asset.symbol}, onChain - ${symbol}`);
                  }
                }

                if (decimals !== asset.decimals) {
                  errors.push(`Wrong decimals: current - ${asset.decimals || 'null'}, onChain - ${decimals}`);
                }
              } else {
                errors.push('Cannot get info');
              }

              if (errors.length) {
                tmpErrorAsset[asset.slug] = errors.join(' --- ');
              }
            } catch (e) {
              console.error(asset.slug, e);
              tmpErrorAsset[asset.slug] = 'Fail to get info';
            }
          }

          if (Object.keys(tmpErrorAsset).length) {
            errorAsset[chain] = tmpErrorAsset;
          }

          if (localToken.length) {
            localTokenChain[chain] = localToken;
          }

          await api?.disconnect();
          clearTimeout(timeout);
        });
      }

      if (chainInfo.evmInfo) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
        await new Promise<void>(async (resolve) => {
          const timeHandler = (chain: string) => {
            errorChain[chain] = 'Timeout';

            resolve();
          };

          let _key = key;
          let _provider = provider;

          if (chainInfo.substrateInfo) {
            const providerIndex = assetProviderBackup[chain] || assetProviderBackup.default;

            [_key, _provider] = Object.entries(chainInfo.providers)[providerIndex];
          }

          const timeout = setTimeout(() => {
            timeHandler(chain);
          }, 2 * 60 * 1000);

          const [_api, message] = await evmHandleConnectChain(chain, _key, _provider, chainInfo.evmInfo?.evmChainId || 0);

          if (message) {
            errorChain[chain] = message;
            await _api?.destroy();
            resolve();
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const api = _api!;

          const tmpErrorAsset: Record<string, string> = {};
          const localToken: string[] = [];

          for (const asset of assets) {
            let assetInfo: AssetSpec | undefined;

            try {
              if (asset.assetType === _AssetType.NATIVE) {
                assetInfo = await getEvmNativeInfo(api);
              } else if (asset.assetType === _AssetType.ERC20) {
                assetInfo = await getErc20AssetInfo(asset, api);
              } else if ([_AssetType.PSP34, _AssetType.PSP22, _AssetType.UNKNOWN, _AssetType.ERC721, _AssetType.LOCAL].includes(asset.assetType)) {
                continue;
              }

              if (assetInfo) {
                const { decimals, minAmount, symbol } = assetInfo;
                const errors: string[] = [];

                if (minAmount !== asset.minAmount) {
                  errors.push(`Wrong min amount: current - ${asset.minAmount || 'null'}, onChain - ${minAmount}`);
                }

                if (symbol !== asset.symbol) {
                  const zkSymbol = 'zk' + symbol;

                  if (zkSymbol !== asset.symbol) {
                    errors.push(`Wrong symbol: current - ${asset.symbol}, onChain - ${symbol}`);
                  }
                }

                if (decimals !== asset.decimals) {
                  errors.push(`Wrong decimals: current - ${asset.decimals || 'null'}, onChain - ${decimals}`);
                }

                if (errors.length) {
                  tmpErrorAsset[asset.slug] = errors.join(' --- ');
                }
              } else {
                tmpErrorAsset[asset.slug] = 'Cannot get info';
              }
            } catch (e) {
              console.error(asset.slug, e);
              tmpErrorAsset[asset.slug] = 'Fail to get info';
            }
          }

          if (Object.keys(tmpErrorAsset).length) {
            errorAsset[chain] = tmpErrorAsset;
          }

          if (localToken.length) {
            localTokenChain[chain] = localToken;
          }

          await api?.destroy();
          clearTimeout(timeout);
        });
      }
    }

    console.log('result errorAsset', errorAsset);
    console.log('result errorChain', errorChain);
  });
});
