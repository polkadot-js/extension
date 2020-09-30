// Copyright 2019-2020 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

const ALLOWED_PATH = ['/', '/account/restore-json', '/account/import-seed'] as const;
const PORT_CONTENT = 'content';
const PORT_EXTENSION = 'extension';
const PASSWORD_EXPIRY_MIN = 15;
const PASSWORD_EXPIRY_MS = PASSWORD_EXPIRY_MIN * 60 * 1000;

export {
  ALLOWED_PATH,
  PASSWORD_EXPIRY_MIN,
  PASSWORD_EXPIRY_MS,
  PORT_CONTENT,
  PORT_EXTENSION
};
