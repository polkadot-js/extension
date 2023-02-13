// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import AccountItemBase, { _AccountItemProps } from '@subwallet/extension-koni-ui/components/Account/AccountItemBase';
import React, { useCallback } from 'react';

function AccountItemWithName (props: Partial<_AccountItemProps>): React.ReactElement<Partial<_AccountItemProps>> {
  const { accountName, address, className } = props;
  const renderMiddleItem = useCallback((x: React.ReactNode) => (
    <div className='account-item-content-wrapper'>
      <div className={'account-item-name'}>{accountName}</div>
      <div className={'account-item-address-wrapper'}>({x})</div>
    </div>
  ), [accountName]);

  return (
    <AccountItemBase
      {...props}
      address={address}
      addressPreLength={4}
      addressSufLength={4}
      className={className}
      renderMiddleItem={renderMiddleItem}
    />
  );
}

export default AccountItemWithName;
