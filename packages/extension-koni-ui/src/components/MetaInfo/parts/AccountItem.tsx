// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { useGetAccountByAddress, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { findNetworkJsonByGenesisHash, reformatAddress, toShort } from '@subwallet/extension-koni-ui/util';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { InfoItemBase } from './types';

export interface AccountInfoItem extends InfoItemBase {
  address: string;
  name?: string;
  networkPrefix?: number;
}

const Component: React.FC<AccountInfoItem> = (props: AccountInfoItem) => {
  const { address: accountAddress, className, label, name: accountName, networkPrefix: addressPrefix, valueColorSchema = 'default' } = props;

  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const account = useGetAccountByAddress(accountAddress);

  const name = useMemo(() => {
    return accountName || account?.name;
  }, [account?.name, accountName]);

  const address = useMemo(() => {
    let addPrefix = 42;

    if (addressPrefix !== undefined) {
      addPrefix = addressPrefix;
    }

    if (account?.originGenesisHash) {
      const network = findNetworkJsonByGenesisHash(chainInfoMap, account.originGenesisHash);

      if (network) {
        addPrefix = network.substrateInfo?.addressPrefix ?? addPrefix;
      }
    }

    return reformatAddress(accountAddress, addPrefix);
  }, [account, accountAddress, addressPrefix, chainInfoMap]);

  return (
    <div className={CN(className, '__row -type-account')}>
      {!!label && <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>}
      <div className={'__col -to-right'}>
        <div className={`__account-item __value -is-wrapper -schema-${valueColorSchema}`}>
          <Avatar
            className={'__account-avatar'}
            size={24}
            theme={address ? isEthereumAddress(address) ? 'ethereum' : 'polkadot' : undefined}
            value={address}
          />
          <div className={'__account-name ml-xs'}>
            {name || toShort(address)}
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountItem = styled(Component)<AccountInfoItem>(({ theme: { token } }: AccountInfoItem) => {
  return {};
});

export default AccountItem;
