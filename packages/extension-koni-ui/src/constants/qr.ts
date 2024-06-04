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
export const MULTIPART = new Uint8Array([0]);
export const STANDARD_FRAME_SIZE = 2 ** 8;
export const ETHEREUM_ID = new Uint8Array([0x45]);
export const SUBSTRATE_ID = new Uint8Array([0x53]);
export const CRYPTO_SR25519 = new Uint8Array([0x01]);
export const CRYPTO_ETHEREUM = new Uint8Array([0x03]);
export const CMD = {
  ETHEREUM: {
    SIGN_HASH: 0,
    SIGN_TRANSACTION: 1,
    SIGN_MESSAGE: 2
  },
  SUBSTRATE: {
    SIGN_MORTAL: 0,
    SIGN_HASH: 1,
    SIGN_IMMORTAL: 2,
    SIGN_MSG: 3
  }
};
