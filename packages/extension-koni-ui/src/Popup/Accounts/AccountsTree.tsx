// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountWithChildren } from '@polkadot/extension-base/background/types';

import React from 'react';

import Account from '@polkadot/extension-koni-ui/Popup/Accounts/Account';

interface Props extends AccountWithChildren {
  parentName?: string;
  closeSetting?: () => void;
  changeAccountCallback?: (address: string) => void;
  imgSelected?: string | null;
  setImgSelected?: (imgSelected: string | null) => void;
}

export default function AccountsTree ({ changeAccountCallback, closeSetting, imgSelected, parentName, setImgSelected, suri, ...account }: Props): React.ReactElement<Props> {
  return (
    <>
      <Account
        {...account}
        changeAccountCallback={changeAccountCallback}
        closeSetting={closeSetting}
        imgSelected={imgSelected}
        parentName={parentName}
        setImgSelected={setImgSelected}
        suri={suri}
      />
      {account?.children?.map((child, index) => (
        <AccountsTree
          closeSetting={closeSetting}
          key={`${index}:${child.address}`}
          {...child}
          parentName={account.name}
        />
      ))}
    </>
  );
}
