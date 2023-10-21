// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AvatarGroup } from '@subwallet/extension-koni-ui/components/Account';
import { BaseAccountInfo } from '@subwallet/extension-koni-ui/components/Account/Info/AvatarGroup';
import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { useGetAccountByAddress, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { findNetworkJsonByGenesisHash, isAccountAll, reformatAddress, toShort } from '@subwallet/extension-koni-ui/utils';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface AccountInfoItem extends InfoItemBase {
  address: string;
  name?: string;
  networkPrefix?: number;
  accounts?: BaseAccountInfo[];
}

const Component: React.FC<AccountInfoItem> = (props: AccountInfoItem) => {
  const { accounts, address: accountAddress, className, label, name: accountName, networkPrefix: addressPrefix, valueColorSchema = 'default' } = props;

  const { t } = useTranslation();

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

  const isAll = useMemo(() => isAccountAll(address), [address]);

  return (
    <div className={CN(className, '__row -type-account')}>
      {!!label && <div className={'__col __label-col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>}
      <div className={'__col __value-col -to-right'}>
        <div className={`__account-item __value -is-wrapper -schema-${valueColorSchema}`}>
          {
            isAll
              ? (
                <>
                  <AvatarGroup
                    accounts={accounts}
                    className={'__account-avatar'}
                  />
                  <div className={'__account-name ml-xs'}>
                    {accounts ? t('{{number}} accounts', { replace: { number: accounts.length } }) : t('All accounts')}
                  </div>
                </>
              )
              : (
                <>
                  <Avatar
                    className={'__account-avatar'}
                    size={24}
                    value={address}
                  />
                  <div className={'__account-name ml-xs'}>
                    {name || toShort(address)}
                  </div>
                </>
              )
          }
        </div>
      </div>
    </div>
  );
};

const AccountItem = styled(Component)<AccountInfoItem>(({ theme: { token } }: AccountInfoItem) => {
  return {};
});

export default AccountItem;
