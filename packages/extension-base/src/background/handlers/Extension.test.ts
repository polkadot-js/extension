// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '../../../../../__mocks__/chrome';

import type { ResponseSigning } from '@polkadot/extension-base/background/types';
import type { MetadataDef } from '@polkadot/extension-inject/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ExtDef } from '@polkadot/types/extrinsic/signedExtensions/types';
import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { KeypairType } from '@polkadot/util-crypto/types';

import { TypeRegistry } from '@polkadot/types';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { AccountsStore } from '../../stores';
import Extension from './Extension';
import State, { AuthUrls } from './State';
import Tabs from './Tabs';

describe('Extension', () => {
  let extension: Extension;
  let state: State;
  let tabs: Tabs;
  const suri = 'seed sock milk update focus rotate barely fade car face mechanic mercy';
  // const ETH_SURI = 'seed sock milk update focus rotate barely fade car face mechanic mercy' + '/m/44\'/60\'/0\'/0/0';
  const password = 'passw0rd';

  async function createExtension (): Promise<Extension> {
    await cryptoWaitReady();

    keyring.loadAll({ store: new AccountsStore() });
    const authUrls: AuthUrls = {};

    authUrls['localhost:3000'] = {
      count: 0,
      id: '11',
      isAllowed: true,
      origin: 'example.com',
      url: 'http://localhost:3000'
    };
    localStorage.setItem('authUrls', JSON.stringify(authUrls));
    state = new State();
    tabs = new Tabs(state);

    return new Extension(state);
  }

  const createAccount = async (type?:KeypairType): Promise<string> => {
    await extension.handle('id', 'pri(accounts.create.suri)', type&&type==="ethereum"?{
      name: 'parent',
      password,
      suri,
      type
    }:{
      name: 'parent',
      password,
      suri
    }, {} as chrome.runtime.Port);
    const { address } = await extension.handle('id', 'pri(seed.validate)',type&&type==="ethereum"?{
      suri,
      type
    }: {
      suri
    }, {} as chrome.runtime.Port);

    return address;
  };

  beforeAll(async () => {
    extension = await createExtension();
  });

  test('exports account from keyring', async () => {
    const { pair: { address } } = keyring.addUri(suri, password);
    const result = await extension.handle('id', 'pri(accounts.export)', {
      address,
      password
    }, {} as chrome.runtime.Port);

    expect(result.exportedJson.address).toBe(address);
    expect(result.exportedJson.encoded).toBeDefined();
  });

  describe('account derivation', () => {
    let address: string;

    beforeEach(async () => {
      address = await createAccount();
    });

    test('pri(derivation.validate) passes for valid suri', async () => {
      const result = await extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        parentPassword: password,
        suri: '//path'
      }, {} as chrome.runtime.Port);

      expect(result).toStrictEqual({
        address: '5FP3TT3EruYBNh8YM8yoxsreMx7uZv1J1zNX7fFhoC5enwmN',
        suri: '//path'
      });
    });

    test('pri(derivation.validate) throws for invalid suri', async () => {
      await expect(extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        parentPassword: password,
        suri: 'invalid-path'
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('"invalid-path" is not a valid derivation path'));
    });

    test('pri(derivation.validate) throws for invalid password', async () => {
      await expect(extension.handle('id', 'pri(derivation.validate)', {
        parentAddress: address,
        parentPassword: 'invalid-password',
        suri: '//path'
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('invalid password'));
    });

    test('pri(derivation.create) adds a derived account', async () => {
      await extension.handle('id', 'pri(derivation.create)', {
        name: 'child',
        parentAddress: address,
        parentPassword: password,
        password,
        suri: '//path'
      }, {} as chrome.runtime.Port);
      expect(keyring.getAccounts()).toHaveLength(2);
    });

    test('pri(derivation.create) saves parent address in meta', async () => {
      await extension.handle('id', 'pri(derivation.create)', {
        name: 'child',
        parentAddress: address,
        parentPassword: password,
        password,
        suri: '//path'
      }, {} as chrome.runtime.Port);
      expect(keyring.getAccount('5FP3TT3EruYBNh8YM8yoxsreMx7uZv1J1zNX7fFhoC5enwmN')?.meta.parentAddress).toEqual(address);
    });
  });

  describe('account management', () => {
    let address: string;

    beforeEach(async () => {
      address = await createAccount();
    });

    test('pri(accounts.changePassword) changes account password', async () => {
      const newPass = 'pa55word';
      const wrongPass = 'ZZzzZZzz';

      await expect(extension.handle('id', 'pri(accounts.changePassword)', {
        address,
        newPass,
        oldPass: wrongPass
      }, {} as chrome.runtime.Port)).rejects.toStrictEqual(new Error('oldPass is invalid'));

      await expect(extension.handle('id', 'pri(accounts.changePassword)', {
        address,
        newPass,
        oldPass: password
      }, {} as chrome.runtime.Port)).resolves.toEqual(true);

      const pair = keyring.getPair(address);

      expect(pair.decodePkcs8(newPass)).toEqual(undefined);

      expect(() => {
        pair.decodePkcs8(password);
      }).toThrowError('Unable to decode using the supplied passphrase');
    });
  });

  describe('custom user extension', () => {
    let address: string, payload: SignerPayloadJSON, pair: KeyringPair;

    beforeEach(async () => {
      address = await createAccount();
      pair = keyring.getPair(address);
      pair.decodePkcs8(password);
      payload = {
        address,
        blockHash: '0xe1b1dda72998846487e4d858909d4f9a6bbd6e338e4588e5d809de16b1317b80',
        blockNumber: '0x00000393',
        era: '0x3601',
        genesisHash: '0x242a54b35e1aad38f37b884eddeb71f6f9931b02fac27bf52dfb62ef754e5e62',
        method: '0x040105fa8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a4882380100',
        nonce: '0x0000000000000000',
        signedExtensions: ['CheckSpecVersion', 'CheckTxVersion', 'CheckGenesis', 'CheckMortality', 'CheckNonce', 'CheckWeight', 'ChargeTransactionPayment'],
        specVersion: '0x00000026',
        tip: "0x00000000000000000000000000000000",
        transactionVersion: '0x00000005',
        version: 4
      }
    });

    test('signs with default signed extensions', async () => {
      const registry = new TypeRegistry();

      registry.setSignedExtensions(payload.signedExtensions);

      const signatureExpected = registry
        .createType('ExtrinsicPayload', payload, { version: payload.version }).sign(pair);

      tabs.handle('1615191860871.5', 'pub(extrinsic.sign)', payload, 'http://localhost:3000', {} as chrome.runtime.Port)
        .then((result) => {
          expect((result as ResponseSigning)?.signature).toEqual(signatureExpected.signature);
        }).catch((err) => console.log(err));

      await expect(extension.handle('1615192072290.7', 'pri(signing.approve.password)', {
        id: state.allSignRequests[0].id,
        password,
        savePass: false
      }, {} as chrome.runtime.Port)).resolves.toEqual(true);
    });

    test('signs with default signed extensions - ethereum', async () => {
      const eth_address = await createAccount("ethereum");
      console.log("eth_address",eth_address)
      const eth_pair = keyring.getPair(eth_address);
      eth_pair.decodePkcs8(password);
      const eth_payload:SignerPayloadJSON = {
        specVersion: '0x000003e9',
        transactionVersion:'0x00000002', //'0x00000002',
        address: eth_address,
        blockHash: '0xf9fc354edc3ff49f43d5e2c14e3c609a0c4ba469ed091edf893d672993dc9bc0',
        blockNumber:'0x00000393', //'0x00000000',
        era: '0x3601',//'0x0700',
        genesisHash: '0xf9fc354edc3ff49f43d5e2c14e3c609a0c4ba469ed091edf893d672993dc9bc0',
        method: '0x03003cd0a705a2dc65e5b1e1205896baa2be8a07c6e0070010a5d4e8',
        nonce: '0x00000000',
        signedExtensions: [
          'CheckSpecVersion',
          'CheckTxVersion',
          'CheckGenesis',
          'CheckMortality',
          'CheckNonce',
          'CheckWeight',
          'ChargeTransactionPayment'
        ],
        tip: '0x00000000000000000000000000000000',
        version: 4
      }
      const registry = new TypeRegistry();

      registry.setSignedExtensions(payload.signedExtensions);

      const signatureExpected = registry
        .createType('ExtrinsicPayload', eth_payload, { version: eth_payload.version }).sign(eth_pair);

      tabs.handle('1615191860871.5', 'pub(extrinsic.sign)', eth_payload, 'http://localhost:3000', {} as chrome.runtime.Port)
        .then((result) => {
          expect((result as ResponseSigning)?.signature).toEqual(signatureExpected.signature);
        }).catch((err) => console.log(err));

      await expect(extension.handle('1615192072290.7', 'pri(signing.approve.password)', {
        id: state.allSignRequests[0].id,
        password,
        savePass: false
      }, {} as chrome.runtime.Port)).resolves.toEqual(true);
    });

    test('signs with user extensions, known types', async () => {
      const types = {} as unknown as Record<string, string>;

      const userExtensions = {
        MyUserExtension: {
          extrinsic: {
            assetId: 'AssetId'
          },
          payload: {}
        }
      } as unknown as ExtDef;

      const meta: MetadataDef = {
        chain: 'Development',
        color: '#191a2e',
        genesisHash: '0x242a54b35e1aad38f37b884eddeb71f6f9931b02fac27bf52dfb62ef754e5e62',
        icon: '',
        specVersion: 38,
        ss58Format: 0,
        tokenDecimals: 12,
        tokenSymbol: '',
        types,
        userExtensions
      };

      state.saveMetadata(meta);

      const payload:SignerPayloadJSON = {
        address,
        blockHash: '0xe1b1dda72998846487e4d858909d4f9a6bbd6e338e4588e5d809de16b1317b80',
        blockNumber: '0x00000393',
        era: '0x3601',
        genesisHash: '0x242a54b35e1aad38f37b884eddeb71f6f9931b02fac27bf52dfb62ef754e5e62',
        method: '0x040105fa8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a4882380100',
        nonce: '0x0000000000000000',
        signedExtensions: ['MyUserExtension'],
        specVersion: '0x00000026',
        tip: "0x00000000000000000000000000000000",
        transactionVersion: '0x00000005',
        version: 4
      } // as unknown as SignerPayloadJSON;

      const registry = new TypeRegistry();

      registry.setSignedExtensions(payload.signedExtensions, userExtensions);
      registry.register(types);

      const signatureExpected = registry
        .createType('ExtrinsicPayload', payload, { version: payload.version }).sign(pair);

      tabs.handle('1615191860771.5', 'pub(extrinsic.sign)', payload, 'http://localhost:3000', {} as chrome.runtime.Port)
        .then((result) => {
          expect((result as ResponseSigning)?.signature).toEqual(signatureExpected.signature);
        }).catch((err) => console.log(err));

      await expect(extension.handle('1615192062290.7', 'pri(signing.approve.password)', {
        id: state.allSignRequests[0].id,
        password,
        savePass: false
      }, {} as chrome.runtime.Port)).resolves.toEqual(true);
    });

    test('override default signed extension', async () => {
      const types = {
        FeeExchangeV1: {
          assetId: 'Compact<AssetId>',
          maxPayment: 'Compact<Balance>'
        },
        PaymentOptions: {
          feeExchange: 'FeeExchangeV1',
          tip: 'Compact<Balance>'
        }
      } as unknown as Record<string, string>;

      const userExtensions = {
        ChargeTransactionPayment: {
          extrinsic: {
            transactionPayment: 'PaymentOptions'
          },
          payload: {}
        }
      } as unknown as ExtDef;

      const meta: MetadataDef = {
        chain: 'Development',
        color: '#191a2e',
        genesisHash: '0x242a54b35e1aad38f37b884eddeb71f6f9931b02fac27bf52dfb62ef754e5e62',
        icon: '',
        specVersion: 38,
        ss58Format: 0,
        tokenDecimals: 12,
        tokenSymbol: '',
        types,
        userExtensions
      };

      state.saveMetadata(meta);

      const registry = new TypeRegistry();

      registry.setSignedExtensions(payload.signedExtensions, userExtensions);
      registry.register(types);

      const signatureExpected = registry
        .createType('ExtrinsicPayload', payload, { version: payload.version }).sign(pair);

      tabs.handle('1615191860771.5', 'pub(extrinsic.sign)', payload, 'http://localhost:3000', {} as chrome.runtime.Port)
        .then((result) => {
          expect((result as ResponseSigning)?.signature).toEqual(signatureExpected.signature);
        }).catch((err) => console.log(err));

      await expect(extension.handle('1615192062290.7', 'pri(signing.approve.password)', {
        id: state.allSignRequests[0].id,
        password,
        savePass: false
      }, {} as chrome.runtime.Port)).resolves.toEqual(true);
    });

    test('signs with user extensions, additional types', async () => {
      const types = {
        myCustomType: {
          feeExchange: 'Compact<AssetId>',
          tip: 'Compact<Balance>'
        }
      } as unknown as Record<string, string>;

      const userExtensions = {
        MyUserExtension: {
          extrinsic: {
            myCustomType: 'myCustomType'
          },
          payload: {}
        }
      } as unknown as ExtDef;

      const meta: MetadataDef = {
        chain: 'Development',
        color: '#191a2e',
        genesisHash: '0x242a54b35e1aad38f37b884eddeb71f6f9931b02fac27bf52dfb62ef754e5e62',
        icon: '',
        specVersion: 38,
        ss58Format: 0,
        tokenDecimals: 12,
        tokenSymbol: '',
        types,
        userExtensions
      };

      state.saveMetadata(meta);

      const payload = {
        address,
        blockHash: '0xe1b1dda72998846487e4d858909d4f9a6bbd6e338e4588e5d809de16b1317b80',
        blockNumber: '0x00000393',
        era: '0x3601',
        genesisHash: '0x242a54b35e1aad38f37b884eddeb71f6f9931b02fac27bf52dfb62ef754e5e62',
        method: '0x040105fa8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a4882380100',
        nonce: '0x0000000000000000',
        signedExtensions: ['MyUserExtension', 'CheckTxVersion', 'CheckGenesis', 'CheckMortality', 'CheckNonce', 'CheckWeight', 'ChargeTransactionPayment'],
        specVersion: '0x00000026',
        tip: null,
        transactionVersion: '0x00000005',
        version: 4
      } as unknown as SignerPayloadJSON;

      const registry = new TypeRegistry();

      registry.setSignedExtensions(payload.signedExtensions, userExtensions);
      registry.register(types);

      const signatureExpected = registry
        .createType('ExtrinsicPayload', payload, { version: payload.version }).sign(pair);

      tabs.handle('1615191860771.5', 'pub(extrinsic.sign)', payload, 'http://localhost:3000', {} as chrome.runtime.Port)
        .then((result) => {
          expect((result as ResponseSigning)?.signature).toEqual(signatureExpected.signature);
        }).catch((err) => console.log(err));

      await expect(extension.handle('1615192062290.7', 'pri(signing.approve.password)', {
        id: state.allSignRequests[0].id,
        password,
        savePass: false
      }, {} as chrome.runtime.Port)).resolves.toEqual(true);
    });
  });
});
