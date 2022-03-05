// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Keyring } from '@polkadot/keyring';

// import _decode from '@polkadot/keyring/pair/decode';

function extract (address: string) {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const rs = this.getPair(address);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  console.log(rs.publicKey);
}

export function extractPrivateKey (keyring: Keyring, address: string, password: string) {
  extract.call(keyring, address);
}
