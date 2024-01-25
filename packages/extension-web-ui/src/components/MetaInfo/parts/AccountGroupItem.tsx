// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AvatarGroup } from '@subwallet/extension-web-ui/components';
import { BaseAccountInfo } from '@subwallet/extension-web-ui/components/Account/Info/AvatarGroup';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface AccountGroupInfoItem extends InfoItemBase {
  accounts: Array<BaseAccountInfo>;
  content: string;
  onClick?: () => void
}

const Component: React.FC<AccountGroupInfoItem> = (props: AccountGroupInfoItem) => {
  const { accounts, className, content, label, onClick, valueColorSchema = 'default' } = props;

  return (
    <div
      className={CN(className, '__row -type-account')}
      onClick={onClick}
    >
      {!!label && <div className={'__col __label-col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>}
      <div className={'__col __value-col -to-right'}>
        <div className={`__account-item __value -is-wrapper -schema-${valueColorSchema}`}>
          <AvatarGroup accounts={accounts} />
          <div className={'__account-name ml-xs'}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountGroupItem = styled(Component)<AccountGroupInfoItem>(({ theme: { token } }: AccountGroupInfoItem) => {
  return {};
});

export default AccountGroupItem;
