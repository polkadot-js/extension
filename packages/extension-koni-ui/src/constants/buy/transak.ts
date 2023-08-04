// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const TRANSAK_API_KEY = process.env.TRANSAK_API_KEY || '4b767e2c-2e01-45c9-978e-d32c6f0c8900';
export const TRANSAK_TEST_MODE = process.env.TRANSAK_TEST_MODE !== undefined ? !!process.env.TRANSAK_TEST_MODE : true;

export const TRANSAK_URL = TRANSAK_TEST_MODE ? 'https://global-stg.transak.com/' : 'https://global.transak.com';
