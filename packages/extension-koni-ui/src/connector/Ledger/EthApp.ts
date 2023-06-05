// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
// FIXME drop:
import type Transport from '@ledgerhq/hw-transport';

import { ledgerService } from '@ledgerhq/hw-app-eth';
import { EthAppNftNotSupported, EthAppPleaseEnableContractData } from '@ledgerhq/hw-app-eth/src/errors';
// NB: these are temporary import for the deprecated fallback mechanism
import { LedgerEthTransactionResolution, LoadConfig } from '@ledgerhq/hw-app-eth/src/services/types';
import { BigNumber } from 'bignumber.js';
import { Buffer } from 'buffer';
import { decode, encode } from 'rlp';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const remapTransactionRelatedErrors = (e: any): any => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (e && e.statusCode === 0x6a80) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return new EthAppPleaseEnableContractData(
      'Please enable Blind signing or Contract data in the Ethereum app Settings'
    );
  }

  return e;
};

/**
 * Ethereum API
 *
 * @example
 * import Eth from "@ledgerhq/hw-app-eth";
 * const eth = new Eth(transport)
 */

const CLA_MAP: Record<string, number> = {
  ethereum: 0xe0,
  moonbeam: 0x01e0,
  moonriver: 0x02e0,
  moonbase: 0x03e0
};

export default class Eth {
  transport: Transport;
  loadConfig: LoadConfig;
  private readonly cla: number;

  constructor (
    transport: Transport,
    network: string,
    scrambleKey = 'w0w',
    loadConfig: LoadConfig = {}
  ) {
    this.transport = transport;
    this.loadConfig = loadConfig;
    this.cla = CLA_MAP[network] || CLA_MAP.ethereum;
    transport.decorateAppAPIMethods(
      this,
      [
        'getAddress',
        'signTransaction',
        'signPersonalMessage',
        'getAppConfiguration'
      ],
      scrambleKey
    );
  }

  /**
   * get Ethereum address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @param boolDisplay
   * @param boolChaincode
   * @option boolDisplay optionally enable or not the display
   * @option boolChaincode optionally enable or not the chaincode request
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * eth.getAddress("44'/60'/0'/0/0").then(o => o.address)
   */
  getAddress (
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean
  ): Promise<{
      publicKey: string;
      address: string;
      chainCode?: string;
    }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);

    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });

    return this.transport
      .send(
        this.cla,
        0x02,
        boolDisplay ? 0x01 : 0x00,
        boolChaincode ? 0x01 : 0x00,
        buffer
      )
      .then((response) => {
        const publicKeyLength = response[0];
        const addressLength = response[1 + publicKeyLength];

        return {
          publicKey: response.slice(1, 1 + publicKeyLength).toString('hex'),
          address:
            '0x' +
            response
              .slice(
                1 + publicKeyLength + 1,
                1 + publicKeyLength + 1 + addressLength
              )
              .toString('ascii'),
          chainCode: boolChaincode
            ? response
              .slice(
                1 + publicKeyLength + 1 + addressLength,
                1 + publicKeyLength + 1 + addressLength + 32
              )
              .toString('hex')
            : undefined
        };
      });
  }

  /**
   * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign.
   *
   * @param path: the BIP32 path to sign the transaction on
   * @param rawTxHex: the raw ethereum transaction in hexadecimal to sign
   * @param resolution: resolution is an object with all "resolved" metadata necessary to allow the device to clear sign information. This includes: ERC20 token information, plugins, contracts, NFT signatures,... You must explicitly provide something to avoid having a warning. By default, you can use Ledger's service or your own resolution service. See services/types.js for the contract. Setting the value to "null" will fallback everything to blind signing but will still allow the device to sign the transaction.
   * @example
   import { ledgerService } from "@ledgerhq/hw-app-eth"
   const tx = "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080"; // raw tx to sign
   const resolution = await ledgerService.resolveTransaction(tx);
   const result = eth.signTransaction("44'/60'/0'/0/0", tx, resolution);
   console.log(result);
   */
  async signTransaction (
    path: string,
    rawTxHex: string,
    resolution?: LedgerEthTransactionResolution | null
  ): Promise<{
      s: string;
      v: string;
      r: string;
    }> {
    if (resolution === undefined) {
      console.warn(
        'hw-app-eth: signTransaction(path, rawTxHex, resolution): ' +
        "please provide the 'resolution' parameter. " +
        'See https://github.com/LedgerHQ/ledgerjs/blob/master/packages/hw-app-eth/README.md ' +
        "– the previous signature is deprecated and providing the 3rd 'resolution' parameter explicitly will become mandatory so you have the control on the resolution and the fallback mecanism (e.g. fallback to blind signing or not)." +
        '// Possible solution:\n' +
        " + import { ledgerService } from '@ledgerhq/hw-app-eth';\n" +
        ' + const resolution = await ledgerService.resolveTransaction(rawTxHex);'
      );
      resolution = await ledgerService
        .resolveTransaction(rawTxHex, this.loadConfig, {
          externalPlugins: true,
          erc20: true
        })
        .catch((e) => {
          console.warn('an error occurred in resolveTransaction => fallback to blind signing: ' + String(e));

          return null;
        });
    }

    // provide to the device resolved information to make it clear sign the signature
    if (resolution) {
      for (const plugin of resolution.plugin) {
        await setPlugin(this.transport, this.cla, plugin);
      }

      for (const { payload, signature } of resolution.externalPlugin) {
        await setExternalPlugin(this.transport, this.cla, payload, signature);
      }

      for (const nft of resolution.nfts) {
        await provideNFTInformation(this.transport, this.cla, Buffer.from(nft, 'hex'));
      }

      for (const data of resolution.erc20Tokens) {
        await provideERC20TokenInformation(
          this.transport,
          this.cla,
          Buffer.from(data, 'hex')
        );
      }
    }

    const rawTx = Buffer.from(rawTxHex, 'hex');
    const { chainId, chainIdTruncated, txType, vrsOffset } =
      decodeTxInfo(rawTx);

    const paths = splitPath(path);
    let response: Buffer | undefined;
    let offset = 0;

    while (offset !== rawTx.length) {
      const first = offset === 0;
      const maxChunkSize = first ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize =
        offset + maxChunkSize > rawTx.length
          ? rawTx.length - offset
          : maxChunkSize;

      if (vrsOffset !== 0 && offset + chunkSize >= vrsOffset) {
        // Make sure that the chunk doesn't end right on the EIP 155 marker if set
        chunkSize = rawTx.length - offset;
      }

      const buffer = Buffer.alloc(
        first ? 1 + paths.length * 4 + chunkSize : chunkSize
      );

      if (first) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        rawTx.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }

      response = await this.transport
        .send(this.cla, 0x04, first ? 0x00 : 0x80, 0x00, buffer)
        .catch((e) => {
          throw remapTransactionRelatedErrors(e);
        });

      offset += chunkSize;
    }

    response = response as Buffer;

    const responseByte: number = response[0];
    let v = '';

    console.log(responseByte);

    if (chainId.times(2).plus(35).plus(1).isGreaterThan(255)) {
      const oneByteChainId = (chainIdTruncated * 2 + 35) % 256;
      const eccParity = Math.abs(responseByte - oneByteChainId);

      if (txType != null) {
        // For EIP2930 and EIP1559 tx, v is simply the parity.
        v = eccParity % 2 === 1 ? '00' : '01';
      } else {
        // Legacy type transaction with a big chain ID
        v = chainId.times(2).plus(35).plus(eccParity).toString(16);
      }
    } else {
      v = responseByte.toString(16);
    }

    // Make sure v has is prefixed with a 0 if its length is odd ("1" -> "01").
    if (v.length % 2 === 1) {
      v = '0' + v;
    }

    console.log(v);
    const r = response.slice(1, 1 + 32).toString('hex');
    const s = response.slice(1 + 32, 1 + 32 + 32).toString('hex');

    return { v, r, s };
  }

  /**
   */
  getAppConfiguration (): Promise<{
    arbitraryDataEnabled: number;
    erc20ProvisioningNecessary: number;
    starkEnabled: number;
    starkv2Supported: number;
    version: string;
  }> {
    return this.transport.send(this.cla, 0x06, 0x00, 0x00).then((response) => {
      return {
        arbitraryDataEnabled: response[0] & 0x01,
        erc20ProvisioningNecessary: response[0] & 0x02,
        starkEnabled: response[0] & 0x04,
        starkv2Supported: response[0] & 0x08,
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        version: '' + response[1] + '.' + response[2] + '.' + response[3]
      };
    });
  }

  /**
   * You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
   * @example
   eth.signPersonalMessage("44'/60'/0'/0/0", Buffer.from("test").toString("hex")).then(result => {
  var v = result['v'] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  console.log("Signature 0x" + result['r'] + result['s'] + v);
  })
   */
  async signPersonalMessage (
    path: string,
    messageHex: string
  ): Promise<{
      v: number;
      s: string;
      r: string;
    }> {
    const paths = splitPath(path);
    let offset = 0;
    const message = Buffer.from(messageHex, 'hex');
    let response: Buffer = Buffer.alloc(0);

    while (offset !== message.length) {
      const maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 - 4 : 150;
      const chunkSize =
        offset + maxChunkSize > message.length
          ? message.length - offset
          : maxChunkSize;
      const buffer = Buffer.alloc(
        offset === 0 ? 1 + paths.length * 4 + 4 + chunkSize : chunkSize
      );

      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        buffer.writeUInt32BE(message.length, 1 + 4 * paths.length);
        message.copy(
          buffer,
          1 + 4 * paths.length + 4,
          offset,
          offset + chunkSize
        );
      } else {
        message.copy(buffer, 0, offset, offset + chunkSize);
      }

      response = await this.transport.send(
        this.cla,
        0x08,
        offset === 0 ? 0x00 : 0x80,
        0x00,
        buffer
      );

      offset += chunkSize;
    }

    const v = response[0];
    const r = response.slice(1, 1 + 32).toString('hex');
    const s = response.slice(1 + 32, 1 + 32 + 32).toString('hex');

    return { v, r, s };
  }
}

// internal helpers

function provideERC20TokenInformation (
  transport: Transport,
  cla: number,
  data: Buffer
): Promise<boolean> {
  return transport.send(cla, 0x0a, 0x00, 0x00, data).then(
    () => true,
    (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app, since older app version had the ERC20 data hardcoded, it's fine to assume it worked.
        // we return a flag to know if the call was effective or not
        return false;
      }

      throw e;
    }
  );
}

function provideNFTInformation (
  transport: Transport,
  cla: number,
  data: Buffer
): Promise<boolean> {
  return transport.send(cla, 0x14, 0x00, 0x00, data).then(
    () => true,
    (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (e && e.statusCode === 0x6d00) {
        // older version of ETH app => error because we don't allow blind sign when NFT is explicitly requested to be resolved.
        // @ts-ignore
        throw new EthAppNftNotSupported();
      }

      throw e;
    }
  );
}

function setExternalPlugin (
  transport: Transport,
  cla: number,
  payload: string,
  signature: string
): Promise<boolean> {
  const payloadBuffer = Buffer.from(payload, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  const buffer = Buffer.concat([payloadBuffer, signatureBuffer]);

  return transport.send(cla, 0x12, 0x00, 0x00, buffer).then(
    () => true,
    (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (e && e.statusCode === 0x6a80) {
        // this case happen when the plugin name is too short or too long
        return false;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (e && e.statusCode === 0x6984) {
        // this case happen when the plugin requested is not installed on the device
        return false;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app
        return false;
      }

      throw e;
    }
  );
}

function setPlugin (transport: Transport, cla: number, data: string): Promise<boolean> {
  const buffer = Buffer.from(data, 'hex');

  return transport.send(cla, 0x16, 0x00, 0x00, buffer).then(
    () => true,
    (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (e && e.statusCode === 0x6a80) {
        // this case happen when the plugin name is too short or too long
        return false;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (e && e.statusCode === 0x6984) {
        // this case happen when the plugin requested is not installed on the device
        return false;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app
        return false;
      }

      throw e;
    }
  );
}

function splitPath (path: string): number[] {
  const result: number[] = [];
  const components = path.split('/');

  components.forEach((element) => {
    let number = parseInt(element, 10);

    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }

    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }

    result.push(number);
  });

  return result;
}

const decodeTxInfo = (rawTx: Buffer) => {
  const VALID_TYPES = [1, 2];
  const txType = VALID_TYPES.includes(rawTx[0]) ? rawTx[0] : null;
  const rlpData = txType === null ? rawTx : rawTx.slice(1);
  // @ts-ignore
  const rlpTx = decode(rlpData).map((hex) => Buffer.from(hex, 'hex'));
  let chainIdTruncated = 0;
  const rlpDecoded = decode(rlpData);

  let decodedTx;

  if (txType === 2) {
    // EIP1559
    decodedTx = {
      data: rlpDecoded[7],
      to: rlpDecoded[5],
      chainId: rlpTx[0]
    };
  } else if (txType === 1) {
    // EIP2930
    decodedTx = {
      data: rlpDecoded[6],
      to: rlpDecoded[4],
      chainId: rlpTx[0]
    };
  } else {
    // Legacy tx
    decodedTx = {
      data: rlpDecoded[5],
      to: rlpDecoded[3],
      // Default to 1 for non EIP 155 txs
      chainId: rlpTx.length > 6 ? rlpTx[6] : Buffer.from('0x01', 'hex')
    };
  }

  const chainIdSrc = decodedTx.chainId;
  let chainId = new BigNumber(0);

  if (chainIdSrc) {
    // Using BigNumber because chainID could be any uint256.
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
    chainId = new BigNumber(chainIdSrc.toString('hex'), 16);
    const chainIdTruncatedBuf = Buffer.alloc(4);

    // @ts-ignore
    if (chainIdSrc.length > 4) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      chainIdSrc.copy(chainIdTruncatedBuf);
    } else {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      chainIdSrc.copy(chainIdTruncatedBuf, 4 - chainIdSrc.length);
    }

    chainIdTruncated = chainIdTruncatedBuf.readUInt32BE(0);
  }

  let vrsOffset = 0;

  if (txType === null && rlpTx.length > 6) {
    // @ts-ignore
    const rlpVrs = Buffer.from(encode(rlpTx.slice(-3)).slice(2), 'hex');

    vrsOffset = rawTx.length - (rlpVrs.length - 1);

    // First byte > 0xf7 means the length of the list length doesn't fit in a single byte.
    if (rlpVrs[0] > 0xf7) {
      // Increment vrsOffset to account for that extra byte.
      vrsOffset++;

      // Compute size of the list length.
      const sizeOfListLen = rlpVrs[0] - 0xf7;

      // Increase rlpOffset by the size of the list length.
      vrsOffset += sizeOfListLen - 1;
    }
  }

  return {
    decodedTx,
    txType,
    chainId,
    chainIdTruncated,
    vrsOffset
  };
};
