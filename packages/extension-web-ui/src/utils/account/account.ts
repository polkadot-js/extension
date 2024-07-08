// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AbstractAddressJson, AccountAuthType, AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { _getChainSubstrateAddressPrefix, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { isAccountAll, uniqueStringArray } from '@subwallet/extension-base/utils';
import { DEFAULT_ACCOUNT_TYPES, EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-web-ui/constants';
import { MODE_CAN_SIGN } from '@subwallet/extension-web-ui/constants/signing';
import { AccountAddressType, AccountSignMode, AccountType } from '@subwallet/extension-web-ui/types';
import { getLogoByNetworkKey } from '@subwallet/extension-web-ui/utils';
import reformatAddress from '@subwallet/extension-web-ui/utils/account/reformatAddress';
import { getNetworkKeyByGenesisHash } from '@subwallet/extension-web-ui/utils/chain/getNetworkJsonByGenesisHash';
import { AccountInfoByNetwork } from '@subwallet/extension-web-ui/utils/types';

import { decodeAddress, encodeAddress, isAddress, isEthereumAddress } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';

export function getAccountType (address: string): AccountType {
  return isAccountAll(address) ? 'ALL' : isEthereumAddress(address) ? 'ETHEREUM' : 'SUBSTRATE';
}

export const getAccountInfoByNetwork = (networkMap: Record<string, NetworkJson>, address: string, network: NetworkJson): AccountInfoByNetwork => {
  const networkKey = getNetworkKeyByGenesisHash(networkMap, network.genesisHash) || '';

  return {
    address,
    key: networkKey,
    networkKey,
    networkDisplayName: network.chain,
    networkPrefix: network.ss58Format,
    networkLogo: getLogoByNetworkKey(networkKey),
    networkIconTheme: network.isEthereum ? 'ethereum' : (network.icon || 'polkadot'),
    formattedAddress: reformatAddress(address, network.ss58Format, network.isEthereum)
  };
};

export const findAccountByAddress = (accounts: AccountJson[], address?: string): AccountJson | null => {
  try {
    const isAllAccount = address && isAccountAll(address);

    if (!isAddress(address) && !isAllAccount) {
      return null;
    }

    const originAddress = isAccountAll(address) ? address : isEthereumAddress(address) ? address : encodeAddress(decodeAddress(address));
    const result = accounts.find((account) => account.address.toLowerCase() === originAddress.toLowerCase());

    return result || null;
  } catch (e) {
    console.error('Fail to detect address', e);

    return null;
  }
};

export const getSignMode = (account: AccountJson | null | undefined): AccountSignMode => {
  if (!account) {
    return AccountSignMode.UNKNOWN;
  } else {
    if (account.address === ALL_ACCOUNT_KEY) {
      return AccountSignMode.ALL_ACCOUNT;
    } else {
      if (account.isInjected) {
        return AccountSignMode.INJECTED;
      }

      if (account.isExternal) {
        if (account.isHardware) {
          if (account.isGeneric) {
            return AccountSignMode.GENERIC_LEDGER;
          } else {
            return AccountSignMode.LEGACY_LEDGER;
          }
        } else if (account.isReadOnly) {
          return AccountSignMode.READ_ONLY;
        } else {
          return AccountSignMode.QR;
        }
      } else {
        return AccountSignMode.PASSWORD;
      }
    }
  }
};

export const accountCanSign = (signMode: AccountSignMode): boolean => {
  return MODE_CAN_SIGN.includes(signMode);
};

export const filterNotReadOnlyAccount = (accounts: AccountJson[]): AccountJson[] => {
  return accounts.filter((acc) => !acc.isReadOnly);
};

export const isNoAccount = (accounts: AccountJson[] | null): boolean => {
  return accounts ? !accounts.filter((acc) => acc.address !== ALL_ACCOUNT_KEY).length : false;
};

export const searchAccountFunction = (item: AbstractAddressJson, searchText: string): boolean => {
  return item.address.toLowerCase().includes(searchText.toLowerCase()) || (item.name || '').toLowerCase().includes(searchText.toLowerCase());
};

export const formatAccountAddress = (account: AccountJson, networkInfo: _ChainInfo | null): string => {
  const prefix = networkInfo && _getChainSubstrateAddressPrefix(networkInfo) !== -1 ? _getChainSubstrateAddressPrefix(networkInfo) : 42;
  const isEthereum = account.type === 'ethereum' || (!!networkInfo && _isChainEvmCompatible(networkInfo));

  return reformatAddress(account.address, prefix, isEthereum);
};

export const getAccountAddressType = (address?: string): AccountAddressType => {
  if (!address) {
    return AccountAddressType.UNKNOWN;
  }

  if (address === ALL_ACCOUNT_KEY) {
    return AccountAddressType.ALL;
  }

  if (isEthereumAddress(address)) {
    return AccountAddressType.ETHEREUM;
  }

  try {
    decodeAddress(address);

    return AccountAddressType.SUBSTRATE;
  } catch (e) {
    return AccountAddressType.UNKNOWN;
  }
};

export const funcSortByName = (a: AbstractAddressJson, b: AbstractAddressJson) => {
  if (isAccountAll(b.address)) {
    return 3;
  }

  return ((a?.name || '').toLowerCase() > (b?.name || '').toLowerCase()) ? 1 : -1;
};

export const findContactByAddress = (contacts: AbstractAddressJson[], address?: string): AbstractAddressJson | null => {
  try {
    const isAllAccount = address && isAccountAll(address);

    if (!isAddress(address) && !isAllAccount) {
      return null;
    }

    const originAddress = isAccountAll(address) ? address : isEthereumAddress(address) ? address : encodeAddress(decodeAddress(address));
    const result = contacts.find((contact) => contact.address.toLowerCase() === originAddress.toLowerCase());

    return result || null;
  } catch (e) {
    console.error('Fail to detect address', e);

    return null;
  }
};

export const convertKeyTypes = (authTypes: AccountAuthType[]): KeypairType[] => {
  const result: KeypairType[] = [];

  for (const authType of authTypes) {
    if (authType === 'evm') {
      result.push(EVM_ACCOUNT_TYPE);
    } else if (authType === 'substrate') {
      result.push(SUBSTRATE_ACCOUNT_TYPE);
    } else if (authType === 'both') {
      result.push(SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE);
    }
  }

  const _rs = uniqueStringArray(result) as KeypairType[];

  return _rs.length ? _rs : DEFAULT_ACCOUNT_TYPES;
};
