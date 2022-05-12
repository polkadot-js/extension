// Copyright 2019-2022 @subwallet/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { U8A_WRAP_ETHEREUM, U8A_WRAP_POSTFIX, U8A_WRAP_PREFIX, u8aIsWrapped, u8aUnwrapBytes, u8aWrapBytes } from '@polkadot/util';

export const ETHEREUM = U8A_WRAP_ETHEREUM;
export const POSTFIX = U8A_WRAP_POSTFIX;
export const PREFIX = U8A_WRAP_PREFIX;

export const isWrapped = u8aIsWrapped;
export const unwrapBytes = u8aUnwrapBytes;
export const wrapBytes = u8aWrapBytes;
