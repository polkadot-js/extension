// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getSubstrateGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import { isAccountAll } from '@subwallet/extension-koni-base/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Recoded } from '@subwallet/extension-koni-ui/types';
import { accountAllRecoded, defaultRecoded, recodeAddress } from '@subwallet/extension-koni-ui/util';
import AccountItem, { AccountItemProps } from '@subwallet/react-ui/es/web3-block/account-item';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';

export interface _AccountItemProps extends AccountItemProps {
  className?: string;
  genesisHash?: string | null;
  type?: KeypairType;
  accountName?: string;
}

function AccountItemBase (props: Partial<_AccountItemProps>): React.ReactElement<Partial<_AccountItemProps>> {
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const [{ genesisHash: recodedGenesis, prefix }, setRecoded] = useState<Recoded>(defaultRecoded);
  const { address, type: givenType } = props;
  const _isAccountAll = address && isAccountAll(address);
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
  const networkInfo = getChainInfoByGenesisHash(props.genesisHash || recodedGenesis);
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
    // TODO: change recoded
  }, [accounts, _isAccountAll, address, networkInfo, givenType]);

  return (
    <AccountItem
      {...props}
      address={address || ''}
      avatarIdentPrefix={prefix || 42}
      avatarTheme={iconTheme}
      className={props.className}
    />
  );
}

export default AccountItemBase;
