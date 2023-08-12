// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const BANXA_SUBDOMAIN = 'subwallet';
export const BANXA_TEST_MODE = process.env.BANXA_TEST_MODE !== undefined ? !!process.env.BANXA_TEST_MODE : true;

export const BANXA_SANDBOX_API_KEY = process.env.BANXA_SANDBOX_API_KEY || 'subwallet@test24052023@/*436*/';
export const BANXA_SANBOX_API_SECRET = process.env.BANXA_SANBOX_API_SECRET || 'JV5TjrKzl9gO8t8GK4oGhvDEnxAVJIc0';

export const BANXA_URL = BANXA_TEST_MODE ? `https://${BANXA_SUBDOMAIN}.banxa-sandbox.com` : `https://${BANXA_SUBDOMAIN}.banxa.com`;
