// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export enum SIGN_MODE {
  PASSWORD = 'password',
  QR = 'qr',
  LEDGER = 'ledger',
  READ_ONLY = 'readonly',
  ALL_ACCOUNT = 'ALL_ACCOUNT',
  UNKNOWN = 'unknown'
}

export const MODE_CAN_SIGN: SIGN_MODE[] = [SIGN_MODE.PASSWORD, SIGN_MODE.QR, SIGN_MODE.LEDGER];

export const MANUAL_CANCEL_EXTERNAL_REQUEST = 'MANUAL_CANCEL_EXTERNAL_REQUEST';
