// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { KeypairType } from '@polkadot/util-crypto/types';

export interface NewSeedPhraseState {
  accountTypes: KeypairType[];
}
