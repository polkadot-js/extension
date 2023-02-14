// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarTheme from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarTheme';
import useAccountRecoded from '@subwallet/extension-koni-ui/hooks/account/useAccountRecoded';
import AccountItem, { AccountItemProps } from '@subwallet/react-ui/es/web3-block/account-item';
import React from 'react';

import { KeypairType } from '@polkadot/util-crypto/types';

export interface _AccountItemProps extends AccountItemProps {
  className?: string;
  genesisHash?: string | null;
  type?: KeypairType;
  accountName?: string;
}

function AccountItemBase (props: Partial<_AccountItemProps>): React.ReactElement<Partial<_AccountItemProps>> {
  const { address, genesisHash, type: givenType } = props;
  const { formatted, prefix } = useAccountRecoded(address || '', genesisHash, givenType);
  const avatarTheme = useAccountAvatarTheme(address || '');

  return (
    <AccountItem
      {...props}
      address={formatted || ''}
      avatarIdentPrefix={prefix || 42}
      avatarTheme={avatarTheme}
      className={props.className}
    />
  );
}

export default AccountItemBase;
