// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountSignMode } from '@subwallet/extension-koni-ui/types/account';

export const MODE_CAN_SIGN: AccountSignMode[] = [AccountSignMode.PASSWORD, AccountSignMode.QR, AccountSignMode.LEDGER];

export const MANUAL_CANCEL_EXTERNAL_REQUEST = 'MANUAL_CANCEL_EXTERNAL_REQUEST';
