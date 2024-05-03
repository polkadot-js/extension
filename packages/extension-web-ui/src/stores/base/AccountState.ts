// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AddressBookInfo, KeyringState } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AccountsContext } from '@subwallet/extension-base/background/types';
import { AccountState, ReduxStatus } from '@subwallet/extension-web-ui/stores/types';
import { isAccountAll, isNoAccount } from '@subwallet/extension-web-ui/utils';

const initialState: AccountState = {
  // CurrentAccount
  currentAccount: null,
  isAllAccount: false,
  isNoAccount: true,

  // KeyringState
  isReady: false,
  hasMasterPassword: false,
  isLocked: true,

  // AccountsContext
  accounts: [],
  contacts: [],
  hierarchy: [],
  recent: [],
  master: undefined,

  reduxStatus: ReduxStatus.INIT
};

const accountStateSlice = createSlice({
  initialState,
  name: 'accountState',
  reducers: {
    updateKeyringState (state, action: PayloadAction<KeyringState>) {
      const payload = action.payload;

      return {
        ...state,
        ...payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateAccountsContext (state, action: PayloadAction<AccountsContext>) {
      const payload = action.payload;

      return {
        ...state,
        ...payload,
        isNoAccount: isNoAccount(payload.accounts),
        reduxStatus: ReduxStatus.READY
      };
    },
    updateCurrentAccount (state, action: PayloadAction<AccountJson>) {
      const payload = action.payload;

      return {
        ...state,
        currentAccount: payload,
        isAllAccount: isAccountAll(payload?.address),
        reduxStatus: ReduxStatus.READY
      };
    },
    updateAddressBook (state, action: PayloadAction<AddressBookInfo>) {
      const { addresses } = action.payload;

      const contacts = addresses.filter((value) => !value.isRecent);
      const recent = addresses.filter((value) => value.isRecent);

      return {
        ...state,
        contacts: contacts,
        recent: recent,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateAccountsContext, updateCurrentAccount, updateKeyringState } = accountStateSlice.actions;
export default accountStateSlice.reducer;
