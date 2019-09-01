// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Metadata } from '@polkadot/types';

// imports chain details, generally metadata. For the generation of these,
// curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "state_getMetadata", "params":[]}' http://localhost:9933
import alexander from './alexander';
import kusama from './kusama';

interface Chain {
  meta?: Metadata;
  name: string;
  prefix: number;
}

const chains: Record<string, Chain> = {
  '0xdcd1346701ca8396496e52aa2785b1748deb6db09551b72159dcb3e08991025b': {
    name: 'Alexander',
    meta: new Metadata(alexander.meta),
    prefix: 42
  },
  '0x3fd7b9eb6a00376e5be61f01abb429ffb0b104be05eaff4d458da48fcd425baf': {
    name: 'Kusama CC1',
    meta: new Metadata(kusama.meta),
    prefix: 2
  },
  '0xe4e7807c233645b910c8db58e99ed53dc71fbfff5bbe8a5534fb7e83db449210': {
    name: 'Polkadot Dev (0.5.1)',
    prefix: 42
  }
};

export default function findChain (genesisHash: string): Chain | null {
  return chains[genesisHash] || null;
}
