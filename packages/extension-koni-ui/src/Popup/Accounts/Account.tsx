// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import check from '@polkadot/extension-koni-ui/assets/check.svg';
import { AccountContext, ActionContext } from '@polkadot/extension-koni-ui/components';
import AccountInfo from '@polkadot/extension-koni-ui/components/AccountInfo';
import { saveCurrentAccountAddress } from '@polkadot/extension-koni-ui/messaging';
import { RootState, store } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { findAccountByAddress } from '@polkadot/extension-koni-ui/util';
import NftContainer from "@polkadot/extension-koni-ui/components/NftContainer";

interface Props extends AccountJson {
  className?: string;
  parentName?: string;
}

function Account ({ address, className, closeSetting, genesisHash, name, parentName, suri, type }: Props): React.ReactElement<Props> {
  const [isSelected, setSelected] = useState(false);
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const currentAccount = useSelector((state: RootState) => state.currentAccount);

  useEffect((): void => {
    if (currentAccount?.address === address) {
      setSelected(true);
    } else {
      setSelected(false);
    }
  }, [address]);

  const _changeAccount = useCallback(
    () => {
      setSelected(true);

      if (address) {
        const accountByAddress = findAccountByAddress(accounts, address);

        if (accountByAddress) {
          saveCurrentAccountAddress(address).then(() => {
            store.dispatch({ type: 'currentAccount/updateAccount', payload: accountByAddress });
          }).catch((e) => {
            console.error('There is a problem when set Current Account', e);
          });
        } else {
          console.error('There is a problem when change account');
        }
      }

      // @ts-ignore
      closeSetting && closeSetting();
      onAction('/');
    }, []);

  // console.log('currentAccount', currentAccount);

  return (
    <div
      className={className}
      onClick={_changeAccount}
    >
      <NftContainer/>
      {/*{isSelected*/}
      {/*  ? (*/}
      {/*    <img*/}
      {/*      alt='check'*/}
      {/*      src={check}*/}
      {/*    />*/}
      {/*  )*/}
      {/*  : (*/}
      {/*    <div className='account-unchecked-item' />*/}
      {/*  )*/}
      {/*}*/}
      {/*<AccountInfo*/}
      {/*  address={address}*/}
      {/*  className='account__account-item'*/}
      {/*  genesisHash={genesisHash}*/}
      {/*  name={name}*/}
      {/*  parentName={parentName}*/}
      {/*  showCopyBtn={false}*/}
      {/*  suri={suri}*/}
      {/*  type={type}*/}
      {/*/>*/}
    </div>
  );
}

export default styled(Account)(({ theme }: ThemeProps) => `
  position: relative;
  padding: 0 15px;
  border-radius: 8px;
  margin-top: 8px;
  display: flex;


  .account__account-item {
    margin-left: 5px;
  }

  .account-unchecked-item {
    width: 24px;
  }
`);

// &:hover {
//   background-color: ${theme.accountHoverBackground};
//   cursor: pointer;
// }
