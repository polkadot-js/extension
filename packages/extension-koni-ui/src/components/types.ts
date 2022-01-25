// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type OmitProps<T, K> = Pick<T, Exclude<keyof T, K>>;

export type SubtractProps<T, K> = OmitProps<T, keyof K>;

export type BitLength = 8 | 16 | 32 | 64 | 128 | 256;
