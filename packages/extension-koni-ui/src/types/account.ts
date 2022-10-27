// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type NormalAccountSignType = 'Password' | 'Qr' | 'Ledger';

export type AccountSignType = 'Unknown' | 'All' | NormalAccountSignType | 'ReadOnly';
