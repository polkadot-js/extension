// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrowdloanParaState, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountAuthType, AccountJson } from '@subwallet/extension-base/background/types';
import { CLOUDFLARE_PINATA_SERVER } from '@subwallet/extension-koni-base/api/nft/config';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';

import { BN, hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress, ethereumEncode, isEthereumAddress } from '@polkadot/util-crypto';

export const notDef = (x: any) => x === null || typeof x === 'undefined';
export const isDef = (x: any) => !notDef(x);
export const nonEmptyArr = (x: any) => Array.isArray(x) && x.length > 0;
export const isEmptyArray = (x: any) => !Array.isArray(x) || (Array.isArray(x) && x.length === 0);

export function isAccountAll (address: string): boolean {
  return address === ALL_ACCOUNT_KEY;
}

export function reformatAddress (address: string, networkPrefix: number, isEthereum = false): string {
  if (isEthereumAddress(address)) {
    return address;
  }

  if (isAccountAll(address)) {
    return address;
  }

  const publicKey = decodeAddress(address);

  if (isEthereum) {
    return ethereumEncode(publicKey);
  }

  if (networkPrefix < 0) {
    return address;
  }

  return encodeAddress(publicKey, networkPrefix);
}

export function filterAddressByNetworkKey (addresses: string[], networkKey: string, isEthereum?: boolean) {
  if (isEthereum) {
    return addresses.filter((address) => {
      return isEthereumAddress(address);
    });
  } else {
    return addresses.filter((address) => {
      return !isEthereumAddress(address);
    });
  }
}

export function categoryAddresses (addresses: string[]) {
  const substrateAddresses: string[] = [];
  const evmAddresses: string[] = [];

  addresses.forEach((address) => {
    if (isEthereumAddress(address)) {
      evmAddresses.push(address);
    } else {
      substrateAddresses.push(address);
    }
  });

  return [substrateAddresses, evmAddresses];
}

export function convertToEvmAddress (substrateAddress: string): string {
  const addressBytes = decodeAddress(substrateAddress);

  return ethereumEncode('0x' + Buffer.from(addressBytes.subarray(0, 20)).toString('hex'));
}

export function isUrl (targetString: string) {
  let url;

  try {
    url = new URL(targetString);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function inJestTest () {
  return process.env.JEST_WORKER_ID !== undefined;
}

export const parseIpfsLink = (ipfsLink: string) => {
  if (!ipfsLink.includes('ipfs://ipfs/')) {
    return ipfsLink;
  }

  return CLOUDFLARE_PINATA_SERVER + ipfsLink.split('ipfs://ipfs/')[1];
};

export function hexToStr (buf: string): string {
  let str = '';
  let hexStart = buf.indexOf('0x');

  if (hexStart < 0) {
    hexStart = 0;
  } else {
    hexStart = 2;
  }

  for (let i = hexStart, strLen = buf.length; i < strLen; i += 2) {
    const ch = buf[i] + buf[i + 1];
    const num = parseInt(ch, 16);

    // eslint-disable-next-line eqeqeq
    if (num != 0) {
      str += String.fromCharCode(num);
    } else {
      break;
    }
  }

  return str;
}

// eslint-disable-next-line camelcase
export function utf16ToString (uInt16Array: Array<number>): string {
  let str = '';

  // eslint-disable-next-line camelcase
  for (let i = 0; i < uInt16Array.length; i++) {
    str += String.fromCharCode(uInt16Array[i]);
  }

  return str;
}

export function hexToUTF16 (hex: string): Uint8Array {
  const buf = [];
  let hexStart = hex.indexOf('0x');

  if (hexStart < 0) {
    hexStart = 0;
  } else {
    hexStart = 2;
  }

  for (let i = hexStart, strLen = hex.length; i < strLen; i += 2) {
    const ch = hex[i] + hex[i + 1];
    const num = parseInt(ch, 16);

    buf.push(num);
  }

  return new Uint8Array(buf);
}

export const isValidAddress = (address: string) => {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address)
        : decodeAddress(address)
    );

    return true;
  } catch (error) {
    return false;
  }
};

export const toUnit = (balance: number, decimals: number) => {
  if (balance === 0) {
    return 0;
  }

  return balance / (10 ** decimals);
};

export function sumBN (inputArr: BN[]) {
  let rs = new BN(0);

  inputArr.forEach((input) => {
    rs = rs.add(input);
  });

  return rs;
}

export const convertFundStatus = (status: string) => {
  if (status === 'Won' || status === 'Retiring') {
    return CrowdloanParaState.COMPLETED;
  } else if (status === 'Started') {
    return CrowdloanParaState.ONGOING;
  } else if (status === 'Dissolved') {
    return CrowdloanParaState.FAILED;
  } else {
    return undefined;
  }
};

export const isAddressesEqual = (addresses: string[], prevAddresses: string[]) => {
  if (addresses.length !== prevAddresses.length) {
    return false;
  }

  for (const address of addresses) {
    if (!prevAddresses.includes(address)) {
      return false;
    }
  }

  return true;
};

export const isValidProvider = (provider: string) => {
  if (isUrl(provider)) {
    return true;
  } else if (provider.startsWith('wss://') || provider.startsWith('light://')) {
    return true;
  }

  return false;
};

export const getCurrentProvider = (data: NetworkJson) => {
  if (data.currentProvider.startsWith('custom') && data.customProviders) {
    return data.customProviders[data.currentProvider];
  } else {
    return data.providers[data.currentProvider];
  }
};

export const getNftProvider = (data: NetworkJson) => {
  if (data.nftProvider) {
    return data.providers[data.nftProvider];
  }

  return '';
};

export function mergeNetworkProviders (customNetwork: NetworkJson, predefinedNetwork: NetworkJson) { // merge providers for 2 networks with the same genesisHash
  if (customNetwork.customProviders) {
    const parsedCustomProviders: Record<string, string> = {};
    const currentProvider = customNetwork.customProviders[customNetwork.currentProvider];
    const currentProviderMethod = currentProvider.startsWith('http') ? 'http' : 'ws';
    let parsedProviderKey = '';

    for (const customProvider of Object.values(customNetwork.customProviders)) {
      let exist = false;

      for (const [key, provider] of Object.entries(predefinedNetwork.providers)) {
        if (currentProvider === provider) { // point currentProvider to predefined
          parsedProviderKey = key;
        }

        if (provider === customProvider) {
          exist = true;
          break;
        }
      }

      if (!exist) {
        const index = Object.values(parsedCustomProviders).length;

        parsedCustomProviders[`custom_${index}`] = customProvider;
      }
    }

    for (const [key, parsedProvider] of Object.entries(parsedCustomProviders)) {
      if (currentProvider === parsedProvider) {
        parsedProviderKey = key;
      }
    }

    return { currentProviderMethod, parsedProviderKey, parsedCustomProviders };
  } else {
    return { currentProviderMethod: '', parsedProviderKey: '', parsedCustomProviders: {} };
  }
}

export const filterAndSortingAccountByAuthType = (accounts: AccountJson[], accountAuthType: AccountAuthType, sorting = false) => {
  let rs = [...accounts];

  rs = rs.filter((acc) => acc.address !== 'ALL');

  if (accountAuthType === 'substrate') {
    rs = rs.filter((acc) => (acc.type !== 'ethereum'));
  } else if (accountAuthType === 'evm') {
    rs = rs.filter((acc) => (acc.type === 'ethereum'));
  } else {
    if (sorting) {
      rs.sort((acc, acc2) => {
        if ((acc.type === 'ethereum' && acc2.type === 'ethereum') || (acc.type !== 'ethereum' && acc2.type !== 'ethereum')) {
          return 0;
        } else {
          return acc.type === 'ethereum' ? 1 : -1;
        }
      });
    }
  }

  return rs;
};
