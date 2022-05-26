// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@subwallet/extension-koni-ui/types/transaction';
import { rlpItem } from '@subwallet/extension-koni-ui/util/eth';

const transaction = (rlp: string): Transaction | null => {
  try {
    const nonce = rlpItem(rlp, 0);
    const gasPrice = rlpItem(rlp, 1);
    const gas = rlpItem(rlp, 2);
    const action = rlpItem(rlp, 3);
    const value = rlpItem(rlp, 4);
    const data = rlpItem(rlp, 5);
    const ethereumChainId = rlpItem(rlp, 6);

    return new Transaction(nonce,
      gasPrice,
      gas,
      action,
      value,
      data,
      ethereumChainId);
  } catch (e) {
    console.log(e);

    return null;
  }
};

export default transaction;
