// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEnabled, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { createTransactionFromRLP } from '@subwallet/extension-base/utils/eth';
import { EthereumParsedData, ParsedData, SubstrateCompletedParsedData, SubstrateMultiParsedData } from '@subwallet/extension-koni-ui/types/scanner';
import { findAccountByAddress } from '@subwallet/extension-koni-ui/utils/account/account';
import { findNetworkJsonByGenesisHash, getNetworkJsonByInfo } from '@subwallet/extension-koni-ui/utils/chain/getNetworkJsonByGenesisHash';
import BigN from 'bignumber.js';

import { compactFromU8a, hexStripPrefix, hexToU8a, u8aToHex } from '@polkadot/util';
import { blake2AsHex, isEthereumAddress } from '@polkadot/util-crypto';

import strings from '../../constants/strings';

// from https://github.com/maciejhirsz/uos#substrate-payload
const SUBSTRATE_SIGN = '53';
const ETHEREUM_SIGN = '45';

const CRYPTO_ED25519 = '00';
const CRYPTO_SR25519 = '01';

const CMD_SIGN_MORTAL = '00';
const CMD_SIGN_HASH = '01';
const CMD_SIGN_IMMORTAL = '02';
const CMD_SIGN_MSG = '03';

const EVM_SIGN_HASH = '00';
const EVM_SIGN_TRANSACTION = '01';
const EVM_SIGN_MESSAGE = '02';

export const rawDataToU8A = (rawData: string): Uint8Array | null => {
  if (!rawData) {
    return null;
  }

  // Strip filler bytes padding at the end
  if (rawData.substr(-2) === 'ec') {
    rawData = rawData.substr(0, rawData.length - 2);
  }

  while (rawData.substr(-4) === 'ec11') {
    rawData = rawData.substr(0, rawData.length - 4);
  }

  // Verify that the QR encoding is binary and it's ending with a proper terminator
  if (rawData.substr(0, 1) !== '4' || rawData.substr(-1) !== '0') {
    return null;
  }

  // Strip the encoding indicator and terminator for ease of reading
  rawData = rawData.substr(1, rawData.length - 2);

  const length8 = parseInt(rawData.substr(0, 2), 16) || 0;
  const length16 = parseInt(rawData.substr(0, 4), 16) || 0;
  let length = 0;

  // Strip length prefix
  if (length8 * 2 + 2 === rawData.length) {
    rawData = rawData.substr(2);
    length = length8;
  } else if (length16 * 2 + 4 === rawData.length) {
    rawData = rawData.substr(4);
    length = length16;
  } else {
    return null;
  }

  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(rawData.substr(i * 2, 2), 16);
  }

  return bytes;
};

export const constructDataFromBytes = (bytes: Uint8Array, multipartComplete = false, networkMap: Record<string, _ChainInfo>, networkStateMap: Record<string, _ChainState>, accounts: AccountJson[]): ParsedData => {
  const frameInfo = hexStripPrefix(u8aToHex(bytes.slice(0, 5)));
  const frameCount = parseInt(frameInfo.substr(2, 4), 16);
  const isMultipart = frameCount > 1; // for simplicity, even single frame payloads are marked as multipart.

  if (frameCount > 50) {
    throw new Error(strings.ERROR_WRONG_RAW);
  }

  const currentFrame = parseInt(frameInfo.substr(6, 4), 16);
  const uosAfterFrames = hexStripPrefix(u8aToHex(bytes.slice(5)));

  // UOS after frames can be metadata json
  if (isMultipart && !multipartComplete) {
    return {
      currentFrame,
      frameCount,
      isMultipart,
      partData: uosAfterFrames
    } as SubstrateMultiParsedData;
  }

  const zerothByte = uosAfterFrames.substr(0, 2);
  const firstByte = uosAfterFrames.substr(2, 2);
  const secondByte = uosAfterFrames.substr(4, 2);

  try {
    // decode payload appropriately via UOS
    switch (zerothByte) {
      case ETHEREUM_SIGN: {
        // Ethereum UOS payload
        // for consistency with legacy data format.

        const data = { data: {}, isHash: false } as EthereumParsedData;

        const action =
          firstByte === EVM_SIGN_HASH || firstByte === EVM_SIGN_MESSAGE
            ? 'signData'
            : firstByte === EVM_SIGN_TRANSACTION
              ? 'signTransaction'
              : null;
        const address = '0x' + uosAfterFrames.substr(4, 40);

        data.action = action;
        data.data.account = address;
        const sender = findAccountByAddress(accounts, data.data.account);

        if (action === 'signTransaction') {
          data.data.rlp = '0x' + uosAfterFrames.slice(44);
          const tx = createTransactionFromRLP(data.data.rlp);

          if (!tx) {
            throw new Error('Cannot parse rlp transaction');
          }

          const evmChainId = new BigN(tx.ethereumChainId).toNumber();
          const senderNetwork = getNetworkJsonByInfo(networkMap, isEthereumAddress(address), true, evmChainId);

          if (!senderNetwork) {
            throw new Error('Failed to sign. Network not found');
          }

          if (!_isChainEnabled(networkStateMap[senderNetwork.slug])) {
            throw new Error('Inactive network. Please enable {{networkName}} on this device and try again'.replace('{{networkName}}', senderNetwork.name?.replace(' Relay Chain', '')));
          }

          if (!sender) {
            throw new Error('Account has not been imported into this device. Please import an account and try again.');
          }
        } else if (action === 'signData') {
          if (firstByte === EVM_SIGN_HASH) {
            data.isHash = true;
          }

          data.data.data = uosAfterFrames.slice(44);
        } else {
          console.error('Failed to identify action type.');
          throw new Error();
        }

        return data;
      }

      case SUBSTRATE_SIGN: {
        // Substrate UOS payload
        // for consistency with legacy data format.
        const data = { data: {} } as SubstrateCompletedParsedData;

        /*
          export function createSignPayload (address: string, cmd: number, payload: string | Uint8Array, genesisHash: string | Uint8Array): Uint8Array {
            return u8aConcat(
              SUBSTRATE_ID,
              CRYPTO_SR25519,
              new Uint8Array([cmd]),
              decodeAddress(address),
              u8aToU8a(payload),
              u8aToU8a(genesisHash)
            );
          }
         */

        try {
          data.data.crypto = firstByte === CRYPTO_ED25519 ? 'ed25519' : firstByte === CRYPTO_SR25519 ? 'sr25519' : null;
          const genesisHash = `0x${uosAfterFrames.substr(-64)}`;

          const pubKeyHex = uosAfterFrames.substr(6, 64);

          const { account, addressLength, network } = findNetworkAndAccountByGenesisHash(
            networkMap,
            accounts,
            genesisHash,
            pubKeyHex
          );

          if (!network) {
            console.error(strings.ERROR_NO_NETWORK);
            throw new Error(strings.ERROR_NO_NETWORK);
          }

          if (network && !_isChainEnabled(networkStateMap[network.slug])) {
            console.error(strings.ERROR_NETWORK_INACTIVE.replace('(network name)', network.name));
            throw new Error(strings.ERROR_NETWORK_INACTIVE.replace('(network name)', network.name));
          }

          if (!account) {
            console.error(strings.ERROR_NO_SENDER_FOUND);
            throw new Error(strings.ERROR_NO_SENDER_FOUND);
          }

          const hexEncodedData = '0x' + uosAfterFrames.slice(6 + addressLength);
          const hexPayload = hexEncodedData.slice(0, -64);

          const rawPayload = hexToU8a(hexPayload);

          data.data.genesisHash = genesisHash;

          const isOversized = rawPayload.length > 256;

          switch (secondByte) {
            case CMD_SIGN_MORTAL:
            case CMD_SIGN_IMMORTAL:
              data.action = 'signTransaction';
              data.oversized = isOversized;
              data.isHash = isOversized;

              // Need to review, new version cannot use blake2AsHex to encode data as dataToSign
              // eslint-disable-next-line no-case-declarations
              const [offset] = compactFromU8a(rawPayload);
              // eslint-disable-next-line no-case-declarations
              const payload = rawPayload.subarray(offset);

              data.data.data = isOversized
                ? blake2AsHex(u8aToHex(payload, -1, false))
                : rawPayload;

              data.data.rawPayload = rawPayload;

              break;
            case CMD_SIGN_HASH:
            case CMD_SIGN_MSG:
              data.action = 'signData';
              data.oversized = false;
              data.isHash = secondByte === CMD_SIGN_HASH;
              data.data.data = hexPayload;
              break;
            default:
              break;
          }

          data.data.account = account.address;
        } catch (e) {
          console.log(e);

          if (e instanceof Error) {
            throw new Error(e.message);
          } else {
            throw new Error('Failed to decode the Substrate UOS payload: ' + uosAfterFrames);
          }
        }

        return data;
      }

      default:
        throw new Error('Failed to decode: ' + bytes.toString());
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw new Error(e.message);
    } else {
      throw new Error('Error');
    }
  }
};

export const isJsonString = (str: any): boolean => {
  if (!str) {
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    JSON.parse(str);
  } catch (e) {
    return false;
  }

  return true;
};

export const isAddressString = (str: string): boolean => {
  if (!str) {
    return false;
  }

  return (
    str.substr(0, 2) === '0x' ||
    str.substr(0, 9) === 'ethereum:' ||
    str.substr(0, 10) === 'substrate:'
  );
};

const findNetworkAndAccountByGenesisHash = (
  networkMap: Record<string, _ChainInfo>,
  accounts: AccountJson[],
  genesisHash: string,
  pubKeyHex: string
): { network: _ChainInfo | null; account: AccountJson | null; addressLength: number } => {
  let network: null | _ChainInfo = null;
  let account: AccountJson | null = null;

  for (const forceEthereum of [false, true]) {
    network = findNetworkJsonByGenesisHash(networkMap, genesisHash, forceEthereum);

    if (!network) {
      continue;
    }

    const addressLength = !_isChainEvmCompatible(network) ? 64 : 40;
    const address = pubKeyHex.substring(0, addressLength);

    account = findAccountByAddress(accounts, '0x' + address);

    if (account) {
      return {
        account: account,
        network: network,
        addressLength: addressLength
      };
    }
  }

  return {
    network: network,
    addressLength: 0,
    account: account
  };
};
