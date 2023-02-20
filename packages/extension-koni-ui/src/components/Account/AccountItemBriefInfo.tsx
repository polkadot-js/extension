// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import AvatarGroup from '@subwallet/extension-koni-ui/components/Account/AvatarGroup';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Typography } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  account: AccountJson;
}

const Component: React.FC<Props> = ({ account, className }: Props) => {
  const { t } = useTranslation();
  const isAll = useMemo((): boolean => isAccountAll(account.address), [account.address]);

  return (
    <div className={className}>
      {isAll && <AvatarGroup />}
      <Typography.Text
        className='account-name'
        ellipsis={true}
      >
        { isAll ? t('All accounts') : account.name}
      </Typography.Text>
      {!isAll && <div className='account-address'>(...{account.address.slice(-3)})</div>}
    </div>
  );
};

const AccountItemBriefInfo = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: token.sizeXS,
    alignItems: 'center',
    overflow: 'hidden',

    '.account-name': {
      fontWeight: token.headingFontWeight,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextBase
    },

    '.account-address': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription
    }
  };
});

export default AccountItemBriefInfo;
