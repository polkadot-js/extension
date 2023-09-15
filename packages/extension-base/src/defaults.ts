// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

const ALLOWED_PATH = [
  '/',
  '/settings/security',
  '/accounts/connect-ledger',
  '/accounts/restore-json',
  '/accounts/detail',
  '/accounts/new-seed-phrase'
] as const;
const PHISHING_PAGE_REDIRECT = '/phishing-page-detected';
const EXTENSION_PREFIX = process.env.EXTENSION_PREFIX as string || '';
const ID_PREFIX = process.env.ID_PREFIX as string || EXTENSION_PREFIX || '';
const PORT_MOBILE = `${EXTENSION_PREFIX}mobile`;
const PORT_CONTENT = `${EXTENSION_PREFIX}koni-content`;
const PORT_EXTENSION = `${EXTENSION_PREFIX}koni-extension`;
const MESSAGE_ORIGIN_PAGE = `${EXTENSION_PREFIX}koni-page`;
const MESSAGE_ORIGIN_CONTENT = `${EXTENSION_PREFIX}koni-content`;
const PASSWORD_EXPIRY_MIN = 15;
const PASSWORD_EXPIRY_MS = PASSWORD_EXPIRY_MIN * 60 * 1000;

export {
  ALLOWED_PATH,
  PASSWORD_EXPIRY_MIN,
  PASSWORD_EXPIRY_MS,
  PHISHING_PAGE_REDIRECT,
  EXTENSION_PREFIX,
  ID_PREFIX,
  PORT_MOBILE,
  PORT_CONTENT,
  PORT_EXTENSION,
  MESSAGE_ORIGIN_PAGE,
  MESSAGE_ORIGIN_CONTENT
};
