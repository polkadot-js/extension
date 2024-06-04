// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainLogoMap } from '@subwallet/chain-list';
import { _ChainInfo } from '@subwallet/chain-list/types';
import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AccountWithChildren } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { _getChainSubstrateAddressPrefix, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { Recoded } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils/account/accountAll';
import reformatAddress from '@subwallet/extension-koni-ui/utils/account/reformatAddress';

import { decodeAddress, isEthereumAddress } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';

import { findAccountByAddress } from './account/account';

// todo: Refactor this file

function findSubstrateAccount (accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.filter((a) => !isAccountAll(a.address)).find(({ address }): boolean =>
    decodeAddress(address).toString() === pkStr
  ) || null;
}

export function getEthereumChains (networkMap: Record<string, NetworkJson>): string[] {
  const result: string[] = [];

  Object.keys(networkMap).forEach((k) => {
    if (networkMap[k].isEthereum) {
      result.push(k);
    }
  });

  return result;
}

export const defaultRecoded: Recoded = { account: null, formatted: null, prefix: 42, isEthereum: false };

export const accountAllRecoded: Recoded = {
  account: {
    address: ALL_ACCOUNT_KEY
  },
  formatted: ALL_ACCOUNT_KEY,
  prefix: 42,
  isEthereum: false
};

export function recodeAddress (address: string | undefined, accounts: AccountWithChildren[], networkInfo: _ChainInfo | null, type?: KeypairType): Recoded {
  if (!address) {
    return defaultRecoded;
  } else if (isAccountAll(address)) {
    return accountAllRecoded;
  }

  const publicKey = decodeAddress(address);
  const account = findAccountByAddress(accounts, address) || findSubstrateAccount(accounts, publicKey);
  const prefix = networkInfo && _getChainSubstrateAddressPrefix(networkInfo) !== -1 ? _getChainSubstrateAddressPrefix(networkInfo) : 42;
  const isEthereum = type === 'ethereum' || (!!networkInfo && _isChainEvmCompatible(networkInfo));

  return {
    account,
    formatted: reformatAddress(address, prefix, isEthereum),
    genesisHash: account?.genesisHash,
    originGenesisHash: account?.originGenesisHash,
    prefix,
    isEthereum
  };
}

export const NFT_DEFAULT_GRID_SIZE = 6;

export const NFT_PREVIEW_HEIGHT = 184;

export const NFT_GRID_HEIGHT_THRESHOLD = 600;

export const NFT_HEADER_HEIGHT = 202;

export const NFT_PER_ROW = 3;

export function getLogoByNetworkKey (networkKey: string, defaultLogo = 'default'): string {
  return ChainLogoMap[networkKey] || ChainLogoMap[defaultLogo] || ChainLogoMap.default;
}

export const subscanByNetworkKey: Record<string, string> = {
  acala: 'https://acala.subscan.io',
  // 'altair': 'https://altair.subscan.io',
  astar: 'https://astar.subscan.io',
  astarEvm: 'https://astar.subscan.io',
  // 'basilisk': 'https://basilisk.subscan.io',
  bifrost_dot: 'https://bifrost.subscan.io',
  bifrost: 'https://bifrost-kusama.subscan.io',
  calamari: 'https://calamari.subscan.io',
  centrifuge: 'https://centrifuge.subscan.io',
  clover: 'https://clover.subscan.io',
  // 'coinversation': 'https://coinversation.subscan.io',
  // 'composableFinance': 'https://composableFinance.subscan.io',
  crust: 'https://crust.subscan.io',
  darwinia: 'https://darwinia.subscan.io',
  edgeware: 'https://edgeware.subscan.io',
  // 'efinity': 'https://efinity.subscan.io',
  equilibrium: 'https://equilibrium.subscan.io',
  // 'genshiro': 'https://genshiro.subscan.io',
  heiko: 'https://parallel-heiko.subscan.io',
  hydradx: 'https://hydradx.subscan.io',
  // 'interlay': 'https://interlay.subscan.io',
  karura: 'https://karura.subscan.io',
  khala: 'https://khala.subscan.io',
  kilt: 'https://spiritnet.subscan.io',
  interlay: 'https://interlay.subscan.io',
  kintsugi: 'https://kintsugi.subscan.io',
  kusama: 'https://kusama.subscan.io',
  // 'litentry': 'https://litentry.subscan.io',
  // 'manta': 'https://manta.subscan.io',
  moonbeam: 'https://moonbeam.subscan.io',
  moonriver: 'https://moonriver.subscan.io',
  // 'nodle': 'https://nodle.subscan.io',
  parallel: 'https://parallel.subscan.io',
  // 'phala': 'https://phala.subscan.io',
  picasso: 'https://picasso.subscan.io',
  pichiu: 'https://pichiu.subscan.io',
  pioneer: 'https://pioneer.subscan.io',
  polkadot: 'https://polkadot.subscan.io',
  quartz: 'https://quartz.subscan.io',
  sakura: 'https://sakura.subscan.io',
  // 'shadow': 'https://shadow.subscan.io',
  shiden: 'https://shiden.subscan.io',
  sora: 'https://sora.subscan.io',
  statemine: 'https://statemine.subscan.io',
  subgame: 'https://subgame.subscan.io',
  statemint: 'https://statemint.subscan.io',
  // 'subsocial': 'https://subsocial.subscan.io',
  zeitgeist: 'https://zeitgeist.subscan.io',
  westend: 'https://westend.subscan.io',
  rococo: 'https://rococo.subscan.io',
  robonomics: 'https://robonomics.subscan.io',
  // moonbase: 'https://moonbase.subscan.io',
  dolphin: 'https://dolphin.subscan.io',
  encointer: 'https://encointer.subscan.io',
  chainx: 'https://chainx.subscan.io',
  litmus: 'https://litmus.subscan.io',
  crab: 'https://crab.subscan.io',
  mangatax_para: 'https://mangatax.subscan.io',
  mangatax: 'https://mangata-testnet.subscan.io',
  shibuya: 'https://shibuya.subscan.io',
  arctic_testnet: 'https://arctic.subscan.io',
  snow: 'https://snow.subscan.io',
  subspace_gemini_2a: 'https://subspace.subscan.io',
  equilibrium_parachain: 'https://equilibrium.subscan.io',
  polymesh: 'https://polymesh.subscan.io',
  'sora-substrate': 'https://sora.subscan.io',
  kulupu: 'https://kulupu.subscan.io',
  // genshiro: 'https://genshiro.subscan.io',
  nodle: 'https://nodle.subscan.io'
};

const evmBlockExplorer: Record<string, string> = {
  moonbeam: 'https://moonbeam.moonscan.io',
  moonriver: 'https://moonriver.moonscan.io',
  moonbase: 'https://moonbase.moonscan.io',
  ethereum: 'https://etherscan.io',
  ethereum_goerli: 'https://goerli.etherscan.io',
  binance: 'https://bscscan.com',
  binance_test: 'https://testnet.bscscan.com',
  boba_rinkeby: 'https://blockexplorer.rinkeby.boba.network',
  boba: 'https://blockexplorer.boba.network',
  bobabase: 'https://blockexplorer.bobabase.boba.network',
  bobabeam: 'https://blockexplorer.bobabeam.boba.network'
};

export function isSupportSubscan (networkKey: string): boolean {
  return !!subscanByNetworkKey[networkKey];
}

export function isSupportScanExplorer (networkKey: string): boolean {
  return Object.keys(evmBlockExplorer).includes(networkKey) || isSupportSubscan(networkKey);
}

export function getScanExplorerTransactionHistoryUrl (networkKey: string, hash: string, useSubscan?: boolean): string {
  if (useSubscan && subscanByNetworkKey[networkKey]) {
    return `${subscanByNetworkKey[networkKey]}/extrinsic/${hash}`;
  }

  if (Object.keys(evmBlockExplorer).indexOf(networkKey) > -1) {
    return `${evmBlockExplorer[networkKey]}/tx/${hash}`;
  }

  if (!subscanByNetworkKey[networkKey]) {
    return '';
  }

  return `${subscanByNetworkKey[networkKey]}/extrinsic/${hash}`;
}

export function getScanExplorerAddressInfoUrl (networkKey: string, address: string): string {
  if (Object.keys(evmBlockExplorer).indexOf(networkKey) > -1) {
    return `${evmBlockExplorer[networkKey]}/address/${address}`;
  }

  if (!subscanByNetworkKey[networkKey]) {
    return '';
  }

  return `${subscanByNetworkKey[networkKey]}/account/${address}`;
}

export const detectThemeAvatar = (address?: string) => isEthereumAddress(address) ? 'ethereum' : 'polkadot';

export { toAddress } from './account/toAddress';
export { openInNewTab } from '@subwallet/extension-koni-ui/utils/common/browser';

export * from './account';
export * from './buy';
export * from './campaign';
export * from './chain';
export * from './confirmation';
export * from './connector';
export * from './common';
export * from './form';
export * from './qr';
export * from './scanner';
export * from './sort';
export * from './transaction';
export * from './walletConnect';
export * from './crowdloan';
export * from './crowdloan';
export * from './history';
export * from './earning';
export * from './missionPools';
// export * from './handleRemindBackupTime.ts'; This will load in create view => load direct file to get better performance
