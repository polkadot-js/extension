// Copyright 2017-2022 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { packageInfo as chainsInfo } from '@polkadot/extension-chains/packageInfo';
import { packageInfo as dappInfo } from '@polkadot/extension-dapp/packageInfo';
import { packageInfo as injectInfo } from '@polkadot/extension-inject/packageInfo';
import { detectPackage } from '@polkadot/util';

import __dirname from './cjs/dirname';
import { packageInfo } from './packageInfo';

detectPackage(packageInfo, typeof __dirname !== 'undefined' && __dirname, [chainsInfo, dappInfo, injectInfo]);
