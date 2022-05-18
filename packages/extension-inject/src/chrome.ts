// Copyright 2019-2022 @polkadot/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { extractGlobal, xglobal } from '@polkadot/x-global';

export const chrome = extractGlobal('chrome', xglobal.browser);
