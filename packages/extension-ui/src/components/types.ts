// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign } from '@polkadot/extension/background/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';

export type OmitProps<T, K> = Pick<T, Exclude<keyof T, K>>;
export type SubtractProps<T, K> = OmitProps<T, keyof K>;

export type AccountsFromCtx = Array<KeyringJson>;
export type OnActionFromCtx = (to?: string) => void;
export type RequestsFromCtx = Array<[number, MessageExtrinsicSign, string]>;
