// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type OmitProps<T, K> = Pick<T, Exclude<keyof T, K>>;

export type SubtractProps<T, K> = OmitProps<T, keyof K>;
