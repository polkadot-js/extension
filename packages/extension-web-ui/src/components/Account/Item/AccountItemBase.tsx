// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarInfo from '@subwallet/extension-web-ui/hooks/account/useAccountAvatarInfo';
import useAccountAvatarTheme from '@subwallet/extension-web-ui/hooks/account/useAccountAvatarTheme';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon } from '@subwallet/react-ui';
import AccountItem, { AccountItemProps } from '@subwallet/react-ui/es/web3-block/account-item';
import { CheckCircle } from 'phosphor-react';
import React from 'react';
import styled, { useTheme } from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

export interface AccountItemBaseProps extends Omit<AccountItemProps, 'avatarIdentPrefix'>, ThemeProps {
  genesisHash?: string | null;
  type?: KeypairType;
  accountName?: string;
  showUnselectIcon?: boolean;
  preventPrefix?: boolean;
}

const Component: React.FC<AccountItemBaseProps> = (props: AccountItemBaseProps) => {
  const { address, genesisHash, isSelected, onClick, preventPrefix, rightItem, showUnselectIcon, type: givenType } = props;
  const { address: avatarAddress, prefix } = useAccountAvatarInfo(address ?? '', preventPrefix, genesisHash, givenType);
  const avatarTheme = useAccountAvatarTheme(address || '');
  const { token } = useTheme() as Theme;

  const _rightItem = rightItem || (
    <>
      {(showUnselectIcon || isSelected) && (
        <div className={'ant-account-item-icon'}>
          <Icon
            iconColor={isSelected ? token.colorSuccess : token.colorTextLight4}
            phosphorIcon={CheckCircle}
            size='sm'
            type='phosphor'
            weight='fill'
          />
        </div>
      )}
    </>);

  return (
    <div className={props.className}>
      <AccountItem
        {...props}
        address={avatarAddress ?? ''}
        avatarIdentPrefix={prefix ?? 42}
        avatarTheme={avatarTheme}
        onPressItem={onClick}
        rightItem={_rightItem}
      />
    </div>
  );
};

const AccountItemBase = styled(Component)<AccountItemBaseProps>(({ theme: { token } }: AccountItemBaseProps) => {
  return {
    '.ant-account-item': {
      minHeight: 52,
      paddingTop: 0,
      paddingBottom: 0,
      alignItems: 'center'
    },

    '.ant-web3-block-middle-item': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      overflow: 'hidden'
    },

    '.account-item-content-wrapper': {
      overflow: 'hidden',
      paddingRight: token.sizeXS
    },

    '.account-item-name': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  };
});

export default AccountItemBase;
