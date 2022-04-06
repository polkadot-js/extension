"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PORT_EXTENSION = exports.PORT_CONTENT = exports.PHISHING_PAGE_REDIRECT = exports.PASSWORD_EXPIRY_MS = exports.PASSWORD_EXPIRY_MIN = exports.MESSAGE_ORIGIN_PAGE = exports.MESSAGE_ORIGIN_CONTENT = exports.EXTENSION_PREFIX = exports.ALLOWED_PATH = void 0;
// Copyright 2019-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
const ALLOWED_PATH = ['/', '/account/import-ledger', '/account/restore-json', '/account/create'];
exports.ALLOWED_PATH = ALLOWED_PATH;
const PHISHING_PAGE_REDIRECT = '/phishing-page-detected';
exports.PHISHING_PAGE_REDIRECT = PHISHING_PAGE_REDIRECT;
const EXTENSION_PREFIX = process.env.EXTENSION_PREFIX || '';
exports.EXTENSION_PREFIX = EXTENSION_PREFIX;
const PORT_CONTENT = `${EXTENSION_PREFIX}koni-content`;
exports.PORT_CONTENT = PORT_CONTENT;
const PORT_EXTENSION = `${EXTENSION_PREFIX}koni-extension`;
exports.PORT_EXTENSION = PORT_EXTENSION;
const MESSAGE_ORIGIN_PAGE = `${EXTENSION_PREFIX}koni-page`;
exports.MESSAGE_ORIGIN_PAGE = MESSAGE_ORIGIN_PAGE;
const MESSAGE_ORIGIN_CONTENT = `${EXTENSION_PREFIX}koni-content`;
exports.MESSAGE_ORIGIN_CONTENT = MESSAGE_ORIGIN_CONTENT;
const PASSWORD_EXPIRY_MIN = 15;
exports.PASSWORD_EXPIRY_MIN = PASSWORD_EXPIRY_MIN;
const PASSWORD_EXPIRY_MS = PASSWORD_EXPIRY_MIN * 60 * 1000;
exports.PASSWORD_EXPIRY_MS = PASSWORD_EXPIRY_MS;