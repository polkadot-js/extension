import React from 'react';
import AccountItemBase, { _AccountItemProps } from '@subwallet/extension-koni-ui/components/Account/AccountItemBase';

function AccountItemWithName (props: Partial<_AccountItemProps>): React.ReactElement<Partial<_AccountItemProps>> {
  const { address, accountName, className } = props;
  return (
    <AccountItemBase
      {...props}
      address={address}
      addressPreLength={4}
      addressSufLength={4}
      className={className}
      renderMiddleItem={(x) => (
        <div className='account-item-content-wrapper'>
          <div className={'account-item-name'}>{accountName}</div>
          <div className={'account-item-address-wrapper'}>({x})</div>
        </div>
      )}
    />
  );
}

export default AccountItemWithName
