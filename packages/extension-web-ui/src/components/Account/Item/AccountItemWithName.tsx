// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AbstractAddressJson } from '@subwallet/extension-base/background/types';
import AvatarGroup from '@subwallet/extension-web-ui/components/Account/Info/AvatarGroup';
import AccountItemBase, { AccountItemBaseProps } from '@subwallet/extension-web-ui/components/Account/Item/AccountItemBase';
import { isAccountAll, toShort } from '@subwallet/extension-web-ui/utils';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends AccountItemBaseProps {
  direction?: 'vertical' | 'horizontal';
  accounts?: AbstractAddressJson[];
}

const Component: React.FC<Props> = (props: Props) => {
  const { accountName, accounts, address, addressPreLength = 4, addressSufLength = 4, direction = 'horizontal' } = props;
  const isAll = isAccountAll(address);
  const { t } = useTranslation();

  return (
    <AccountItemBase
      {...props}
      address={address}
      className={CN('account-item-with-name', props.className)}
      leftItem={isAll ? <AvatarGroup accounts={accounts} /> : props.leftItem}
      middleItem={(
        <div className={CN('account-item-content-wrapper', `direction-${direction}`)}>
          <div className={'account-item-name'}>{isAll ? t('All accounts') : (accountName || toShort(address, addressPreLength, addressSufLength))}</div>
          {!isAll && <div className={'account-item-address-wrapper'}>{toShort(address, addressPreLength, addressSufLength)}</div>}
        </div>
      )}
    />
  );
};

const AccountItemWithName = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.account-item-content-wrapper': {
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      display: 'flex',

      '&.direction-horizontal': {
        flexDirection: 'row',

        '.account-item-address-wrapper:before': {
          content: "'('",
          marginLeft: token.marginXXS
        },

        '.account-item-address-wrapper:after': {
          content: "')'"
        }
      },

      '&.direction-vertical': {
        flexDirection: 'column'
      }
    },

    '.account-item-name': {
      color: token.colorTextBase
    },

    '.account-item-address-wrapper': {
      color: token.colorTextDescription,
      whiteSpace: 'nowrap'
    },

    '.ant-account-item-icon': {
      height: 'auto'
    }
  };
});

export default AccountItemWithName;
