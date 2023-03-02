// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const SCANNER_QR_STEP = {
  SCAN_STEP: 1,
  CONFIRM_STEP: 2,
  FINAL_STEP: 3
};

export const SUBSTRATE_PREFIX = 'substrate';
export const ETHEREUM_PREFIX = 'ethereum';
export const SECRET_PREFIX = 'secret';

export enum SCAN_TYPE {
  READONLY = 'READONLY',
  SECRET = 'SECRET',
  QR_SIGNER = 'QR_SIGNER'
}

export const CMD_SIGN_MORTAL = 0;
export const CMD_SIGN_HASH = 1;
export const CMD_SIGN_IMMORTAL = 2;
export const CMD_SIGN_MSG = 3;
