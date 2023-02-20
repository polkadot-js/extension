// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarTheme from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarTheme';
import useAccountRecoded from '@subwallet/extension-koni-ui/hooks/account/useAccountRecoded';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import AccountItem, { AccountItemProps } from '@subwallet/react-ui/es/web3-block/account-item';
import React from 'react';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

export interface AccountItemBaseProps extends Omit<AccountItemProps, 'avatarIdentPrefix'>, ThemeProps {
  genesisHash?: string | null;
  type?: KeypairType;
  accountName?: string;
}

const Component: React.FC<AccountItemBaseProps> = (props: AccountItemBaseProps) => {
  const { address, genesisHash, onClick, type: givenType } = props;
  const { formatted, prefix } = useAccountRecoded(address || '', genesisHash, givenType);
  const avatarTheme = useAccountAvatarTheme(address || '');

  return (
    <div className={props.className}>
      <AccountItem
        {...props}
        address={formatted || ''}
        avatarIdentPrefix={prefix || 42}
        avatarTheme={avatarTheme}
        onPressItem={onClick}
      />
    </div>
  );
};

const AccountItemBase = styled(Component)<AccountItemBaseProps>(({ theme: { token } }: AccountItemBaseProps) => {
  return {

  };
});

export default AccountItemBase;
