// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// this _must_ be changed for each extension
const EXTENSION_PREFIX = process.env.EXTENSION_PREFIX;

if (!EXTENSION_PREFIX) {
  throw new Error('The extension does not define an own EXTENSION_PREFIX environment variable as part of the build, this is required to ensure that messages are not shared between extensions');
}

const PORT_PREFIX = `${EXTENSION_PREFIX}-`;
const PORT_CONTENT = `${PORT_PREFIX}content`;
const PORT_EXTENSION = `${PORT_PREFIX}extension`;
const MESSAGE_ORIGIN_PAGE = `${PORT_PREFIX}page`;
const MESSAGE_ORIGIN_CONTENT = `${PORT_PREFIX}content`;

const ALLOWED_PATH = ['/', '/account/import-ledger', '/account/restore-json'] as const;
const PHISHING_PAGE_REDIRECT = '/phishing-page-detected';
const PASSWORD_EXPIRY_MIN = 15;
const PASSWORD_EXPIRY_MS = PASSWORD_EXPIRY_MIN * 60 * 1000;

export {
  ALLOWED_PATH,
  PASSWORD_EXPIRY_MIN,
  PASSWORD_EXPIRY_MS,
  PHISHING_PAGE_REDIRECT,
  EXTENSION_PREFIX,
  PORT_CONTENT,
  PORT_EXTENSION,
  PORT_PREFIX,
  MESSAGE_ORIGIN_PAGE,
  MESSAGE_ORIGIN_CONTENT
};
