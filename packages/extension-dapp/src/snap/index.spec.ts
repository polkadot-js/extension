// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';

import { DEFAULT_SNAP_NAME, DEFAULT_SNAP_ORIGIN } from './defaults';
import { getMetaDataList, injectedMetamaskSnap } from '.';

declare global {
  interface Window {
    ethereum: any;
  }
}

const TEST_SUBSTRATE_ADDRESS = '5D1tRvT9afsfwzv8n1GBGG5mMMEUagrdf29rrcxnBDVWtz4f';
const TEST_SIGNATURE = '0xafsfwzv8n1GBGG5mMMEUagrdf29rrcxnBDVWtz4f';
const TEST_PAYLOAD = {
  address: TEST_SUBSTRATE_ADDRESS,
  blockHash: '0x123',
  blockNumber: 1,
  era: 1,
  genesisHash: '0x123',
  method: '',
  nonce: 1,
  runtimeVersion: 1,
  signedExtensions: [
    'CheckNonZeroSender',
    'CheckSpecVersion',
    'CheckTxVersion',
    'CheckGenesis',
    'CheckMortality',
    'CheckNonce',
    'CheckWeight',
    'ChargeTransactionPayment'
  ],
  transactionVersion: 1,
  version: 1
} as unknown as SignerPayloadJSON;

describe('Connection to Snap', () => {
  // This section will act as a MetaMask Snap
  beforeAll(() => {
    global.window = {
      ethereum: {
        isMetaMask: true,
        request: (body: string) => {
          const bodyParams = JSON.parse(JSON.stringify(body));
          const method = bodyParams.method as string;

          if (method === 'wallet_requestSnaps') {
            return { [DEFAULT_SNAP_ORIGIN]: { version: 1 } };
          } else if (method === 'wallet_invokeSnap') {
            const snapRequest = bodyParams.params.request.method as string;

            if (snapRequest === 'getAddress') {
              return TEST_SUBSTRATE_ADDRESS;
            } else if (snapRequest === 'getMetadataList') {
              return [{ genesisHash: '0x', specVersion: 0 }];
            } else if (snapRequest === 'signRaw') {
              return { id: 1, signature: TEST_SIGNATURE };
            } else if (snapRequest === 'signJSON') {
              return TEST_SIGNATURE;
            } else {
              return null;
            }
          } else {
            return null;
          }
        }
      }
    } as Window & typeof globalThis;
  });

  it('Get addresses from Snap', async () => {
    if (!injectedMetamaskSnap.connect) {
      return;
    }

    const connectToSnap = await injectedMetamaskSnap.connect('Random Dapp');
    const accountsArray = await connectToSnap?.accounts.get();

    expect(accountsArray).toEqual([{
      address: TEST_SUBSTRATE_ADDRESS,
      name: 'Metamask account 1 🍻',
      type: 'sr25519'
    }]);
  });

  it('injectedMetamaskSnap', async () => {
    if (!injectedMetamaskSnap.connect) {
      return;
    }

    const connectToSnap = await injectedMetamaskSnap.connect(DEFAULT_SNAP_NAME);
    const snapName = connectToSnap.name;
    const snapVersion = connectToSnap.version;
    const metaData = await connectToSnap.metadata?.get();

    expect(snapName).toBe(DEFAULT_SNAP_NAME);
    expect(snapVersion).toBe(1);
    expect(metaData).toEqual([{ genesisHash: '0x', specVersion: 0 }]);
  });

  it('getMetaDataList empty', async () => {
    const expectedResult = [{ genesisHash: '0x', specVersion: 0 }];

    const metaDataList = await getMetaDataList();

    expect(metaDataList).toEqual(expectedResult);
  });

  it('requestSignRaw', async () => {
    if (!injectedMetamaskSnap.connect) {
      return;
    }

    const connectToSnap = await injectedMetamaskSnap.connect(DEFAULT_SNAP_NAME);

    if (!connectToSnap.signer.signRaw) {
      return;
    }

    const signRaw = await connectToSnap.signer.signRaw('Sign me!' as unknown as SignerPayloadRaw);

    expect(signRaw).toEqual({ id: 1, signature: TEST_SIGNATURE });
  });

  it('requestSignJSON', async () => {
    if (!injectedMetamaskSnap.connect) {
      return;
    }

    const connectToSnap = await injectedMetamaskSnap.connect(DEFAULT_SNAP_NAME);

    if (!connectToSnap.signer.signPayload) {
      return;
    }

    const signJSON = await connectToSnap.signer.signPayload(TEST_PAYLOAD);

    expect(signJSON).toEqual(TEST_SIGNATURE);
  });
});
