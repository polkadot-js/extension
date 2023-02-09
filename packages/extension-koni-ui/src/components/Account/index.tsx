// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _getSubstrateGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import { _ChainInfo } from '@subwallet/chain-list/types';
import { accountAllRecoded, defaultRecoded, recodeAddress } from '@subwallet/extension-koni-ui/util';
import { Recoded } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-base/utils';
import AccountItem from '@subwallet/react-ui/es/web3-block/account-item';
import { isEthereumAddress } from '@polkadot/util-crypto';
import AccountCard from '@subwallet/react-ui/es/web3-block/account-card';

interface AccountItemProps extends AccountJson {
  itemType?: 'card' | 'item' | 'item-without-name';
  className?: string;
  avatarSize?: number;
  isSelected?: boolean;
  onPressItem?: () => void;
}

function SwAccountItem ({ className, avatarSize, address, genesisHash, type: givenType, isSelected, name, itemType, onPressItem }: AccountItemProps): React.ReactElement<AccountItemProps> {
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const [{ genesisHash: recodedGenesis, prefix }, setRecoded] = useState<Recoded>(defaultRecoded);

  const getChainInfoByGenesisHash = useCallback((hash?: string | null): _ChainInfo | null => {
    if (!hash) {
      return null;
    }

    for (const n in chainInfoMap) {
      if (!Object.prototype.hasOwnProperty.call(chainInfoMap, n)) {
        continue;
      }

      const networkInfo = chainInfoMap[n];

      if (_getSubstrateGenesisHash(networkInfo) === hash) {
        return networkInfo;
      }
    }

    return null;
  }, [chainInfoMap]);
  const _isAccountAll = address && isAccountAll(address);
  const networkInfo = getChainInfoByGenesisHash(genesisHash || recodedGenesis);
  const iconTheme = useMemo((): 'polkadot'|'ethereum' => {
    if (!address) {
      return 'polkadot';
    }

    if (isEthereumAddress(address)) {
      return 'ethereum';
    }

    return 'polkadot';
  }, [address]);

  useEffect((): void => {
    if (!address) {
      setRecoded(defaultRecoded);

      return;
    }

    if (_isAccountAll) {
      setRecoded(accountAllRecoded);

      return;
    }

    setRecoded(recodeAddress(address, accounts, networkInfo, givenType));
    //TODO: change recoded
  }, [accounts, _isAccountAll, address, networkInfo, givenType]);

  if (itemType === 'card') {
    return (
      <AccountCard
        address={address}
        avatarIdentPrefix={prefix || 42}
        accountName={name || ''}
        isSelected={isSelected}
        onClick={onPressItem}
      />
    );
  }

  if (itemType === 'item') {
    return (
      <AccountItem
        address={address}
        avatarIdentPrefix={prefix || 42}
        isSelected={isSelected}
        onClick={onPressItem}
      />
    );
  }

  return (
    <AccountItem
      className={className}
      avatarSize={avatarSize}
      address={address}
      avatarIdentPrefix={prefix || 42}
      avatarTheme={iconTheme}
      addressPreLength={4}
      addressSufLength={4}
      onClick={onPressItem}
      isSelected={isSelected}
      renderMiddleItem={(x) => (
        <div className='account-item-content-wrapper'>
          <div className={'account-item-name'}>{name}</div>
          <div className={'account-item-address-wrapper'}>({x})</div>
        </div>
      )}
    />
  );
}

export default SwAccountItem;
