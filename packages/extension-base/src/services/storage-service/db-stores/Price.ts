// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PriceJson } from '@subwallet/extension-base/background/KoniTypes';

import BaseStore from './BaseStore';

export default class Price extends BaseStore<PriceJson> {}
