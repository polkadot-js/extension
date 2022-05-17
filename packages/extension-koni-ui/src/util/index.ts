// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AccountWithChildren } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import LogosMap from '@subwallet/extension-koni-ui/assets/logo';
import { NetworkSelectOption } from '@subwallet/extension-koni-ui/hooks/useGenesisHashOptions';
import { Recoded } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util/accountAll';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';

import { decodeAddress, isEthereumAddress } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';

export * from './common';
export * from './chainBalancesApi';
export * from './accountAll';

// todo: Refactor this file

function findSubstrateAccount (accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.filter((a) => !isAccountAll(a.address)).find(({ address }): boolean =>
    decodeAddress(address).toString() === pkStr
  ) || null;
}

export function findAccountByAddress (accounts: AccountJson[], _address: string): AccountJson | null {
  return accounts.find(({ address }): boolean =>
    address === _address
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

export function recodeAddress (address: string, accounts: AccountWithChildren[], networkInfo: NetworkJson | null, type?: KeypairType): Recoded {
  const publicKey = decodeAddress(address);
  const account = findAccountByAddress(accounts, address) || findSubstrateAccount(accounts, publicKey);
  const prefix = networkInfo ? networkInfo.ss58Format : 42;
  const isEthereum = type === 'ethereum' || !!(networkInfo?.isEthereum);

  return {
    account,
    formatted: reformatAddress(address, prefix, isEthereum),
    genesisHash: account?.genesisHash,
    prefix,
    isEthereum
  };
}

function analysisAccounts (accounts: AccountJson[]): [boolean, boolean] {
  let substrateCounter = 0;
  let etherumCounter = 0;

  if (!accounts.length) {
    return [false, false];
  }

  accounts.forEach((a) => {
    if (isAccountAll(a.address)) {
      return;
    }

    if (isEthereumAddress(a.address)) {
      etherumCounter++;
    } else {
      substrateCounter++;
    }
  });

  return [
    etherumCounter === 0 && substrateCounter > 0,
    etherumCounter > 0 && substrateCounter === 0
  ];
}

export function getGenesisOptionsByAddressType (address: string | null | undefined, accounts: AccountJson[], genesisOptions: NetworkSelectOption[]): NetworkSelectOption[] {
  if (!address || !accounts.length) {
    return genesisOptions.filter((o) => !o.isEthereum);
  }

  const result: NetworkSelectOption[] = [];

  if (isAccountAll(address)) {
    const [isContainOnlySubstrate, isContainOnlyEtherum] = analysisAccounts(accounts);

    if (isContainOnlySubstrate) {
      genesisOptions.forEach((o) => {
        if (!o.isEthereum) {
          result.push(o);
        }
      });
    } else if (isContainOnlyEtherum) {
      genesisOptions.forEach((o) => {
        if (o.isEthereum || o.networkKey === 'all') {
          result.push(o);
        }
      });
    } else {
      return genesisOptions;
    }
  } else if (isEthereumAddress(address)) {
    genesisOptions.forEach((o) => {
      if (o.isEthereum || o.networkKey === 'all') {
        result.push(o);
      }
    });
  } else {
    genesisOptions.forEach((o) => {
      if (!o.isEthereum) {
        result.push(o);
      }
    });
  }

  return result;
}

export const defaultRecoded: Recoded = { account: null, formatted: null, prefix: 42, isEthereum: false };

export const NFT_DEFAULT_GRID_SIZE = 6;

export const NFT_PREVIEW_HEIGHT = 184;

export const NFT_GRID_HEIGHT_THRESHOLD = 600;

export const NFT_HEADER_HEIGHT = 202;

export const NFT_PER_ROW = 3;

export const accountAllRecoded: Recoded = {
  account: {
    address: ALL_ACCOUNT_KEY
  },
  formatted: ALL_ACCOUNT_KEY,
  prefix: 42,
  isEthereum: false
};

export function getLogoByNetworkKey (networkKey: string, defaultLogo = 'default'): string {
  return LogosMap[networkKey] || LogosMap[defaultLogo] || LogosMap.default;
}

export const subscanByNetworkKey: Record<string, string> = {
  acala: 'https://acala.subscan.io',
  // 'altair': 'https://altair.subscan.io',
  astar: 'https://astar.subscan.io',
  // 'basilisk': 'https://basilisk.subscan.io',
  bifrost: 'https://bifrost.subscan.io',
  calamari: 'https://calamari.subscan.io',
  centrifuge: 'https://centrifuge.subscan.io',
  clover: 'https://clover.subscan.io',
  // 'coinversation': 'https://coinversation.subscan.io',
  // 'composableFinance': 'https://composableFinance.subscan.io',
  crust: 'https://crust.subscan.io',
  darwinia: 'https://darwinia.subscan.io',
  edgeware: 'https://edgeware.subscan.io',
  // 'efinity': 'https://efinity.subscan.io/',
  equilibrium: 'https://equilibrium.subscan.io',
  // 'genshiro': 'https://genshiro.subscan.io',
  heiko: 'https://parallel-heiko.subscan.io',
  hydradx: 'https://hydradx.subscan.io',
  // 'interlay': 'https://interlay.subscan.io',
  karura: 'https://karura.subscan.io',
  khala: 'https://khala.subscan.io',
  kilt: 'https://spiritnet.subscan.io',
  kintsugi: 'https://kintsugi.subscan.io',
  kusama: 'https://kusama.subscan.io',
  // 'litentry': 'https://litentry.subscan.io',
  // 'manta': 'https://manta.subscan.io',
  // moonbeam: 'https://moonbeam.subscan.io',
  // moonriver: 'https://moonriver.subscan.io',
  // 'nodle': 'https://nodle.subscan.io',
  parallel: 'https://parallel.subscan.io',
  // 'phala': 'https://phala.subscan.io',
  picasso: 'https://picasso.subscan.io',
  pichiu: 'https://pichiu.subscan.io',
  // 'pioneer': 'https://pioneer.subscan.io',
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
  dolphin: 'https://dolphin.subscan.io/',
  encointer: 'https://encointer.subscan.io/',
  chainx: 'https://chainx.subscan.io/',
  litmus: 'https://litmus.subscan.io/'
};

export const moonbeamScanUrl = 'https://moonbeam.moonscan.io';

export const moonriverScanUrl = 'https://moonriver.moonscan.io';

export const moonbaseScanUrl = 'https://moonbase.moonscan.io';

export function isSupportSubscan (networkKey: string): boolean {
  return !!subscanByNetworkKey[networkKey];
}

export function isSupportScanExplorer (networkKey: string): boolean {
  return ['moonbeam', 'moonriver', 'moonbase'].includes(networkKey) || isSupportSubscan(networkKey);
}

export function getScanExplorerTransactionHistoryUrl (networkKey: string, hash: string): string {
  if (networkKey === 'moonbeam') {
    return `${moonbeamScanUrl}/tx/${hash}`;
  }

  if (networkKey === 'moonriver') {
    return `${moonriverScanUrl}/tx/${hash}`;
  }

  if (networkKey === 'moonbase') {
    return `${moonbaseScanUrl}/tx/${hash}`;
  }

  return `${subscanByNetworkKey[networkKey]}/extrinsic/${hash}`;
}

export function getScanExplorerAddressInfoUrl (networkKey: string, address: string): string {
  if (networkKey === 'moonbeam') {
    return `${moonbeamScanUrl}/address/${address}`;
  }

  if (networkKey === 'moonriver') {
    return `${moonriverScanUrl}/address/${address}`;
  }

  if (networkKey === 'moonbase') {
    return `${moonbaseScanUrl}/address/${address}`;
  }

  return `${subscanByNetworkKey[networkKey]}/account/${address}`;
}

export { toAddress } from './toAddress';
