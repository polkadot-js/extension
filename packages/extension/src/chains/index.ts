// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// imports chain details, generally metadata. For the generation of these,
// curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "state_getMetadata", "params":[]}' http://localhost:9933
// and then passing the hex through a base64 encoder (multiples online)
import alexander from './alexander';

type Chain = {
  meta?: Uint8Array,
  name: string
};

const chains: { [genesisHash: string]: Chain } = {
  '0xdcd1346701ca8396496e52aa2785b1748deb6db09551b72159dcb3e08991025b': {
    name: 'Alexander',
    meta: Buffer.from(alexander.meta, 'base64')
  },
  '0x10c08714a10c7da78f40a60f6f732cf0dba97acfb5e2035445b032386157d5c3': {
    name: 'Emberic Elm'
  },
  '0xe1aa646d87d3c0ba5cf5f09d2ff6deb9c373b75d9660ba184b4ca953f92565e6': {
    name: 'Flaming Fir'
  }
};

export default function findChain (genesisHash: string): Chain | null {
  return chains[genesisHash] || null;
}
