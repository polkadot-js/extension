// Copyright 2019-2025 @polkadot/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { exposeGlobal, xglobal } from '@polkadot/x-global';

exposeGlobal('chrome', xglobal.browser);
