// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AuthorizeRequest, SigningRequest } from '@polkadot/extension/background/types';
import { InjectedAccount } from '@polkadot/extension-inject/types';

export type OmitProps<T, K> = Pick<T, Exclude<keyof T, K>>;
export type SubtractProps<T, K> = OmitProps<T, keyof K>;

export type AccountsFromCtx = InjectedAccount[];
export type OnActionFromCtx = (to?: string) => void;
export type AuthRequestsFromCtx = AuthorizeRequest[];
export type SignRequestsFromCtx = SigningRequest[];
