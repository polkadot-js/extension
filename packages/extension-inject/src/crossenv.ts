// Copyright 2019-2022 @subwallet/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { exposeGlobal, xglobal } from '@polkadot/x-global';

exposeGlobal('chrome', xglobal.browser);
