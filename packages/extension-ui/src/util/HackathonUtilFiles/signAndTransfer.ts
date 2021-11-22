// [object Object]
// SPDX-License-Identifier: Apache-2.0

// Import the API, Keyring and some utility functions
// eslint-disable-next-line header/header
import type { Chain } from '@polkadot/extension-chains/types';

import { Dispatch, SetStateAction } from 'react';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import getNetworkInfo from './getNetwork';
import { TransactionStatus } from './pjpeTypes';

export default async function signAndTransfer(
  _senderKeyring: KeyringPair,
  _receiverAddress: string,
  _amount: bigint,
  _chain: Chain | null | undefined,
  setTxStatus: Dispatch<SetStateAction<TransactionStatus>>): Promise<string> {
  const { url } = getNetworkInfo(_chain);
  const wsProvider = new WsProvider(url);
  const api = await ApiPromise.create({ provider: wsProvider });

  return new Promise((resolve) => {
    try {
      if (!_amount) {
        console.log('transfer value:', _amount);
        resolve('');

        return;
      }

      console.log(`transfering  ${_amount} to ${_receiverAddress}`);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      api.tx.balances
        .transfer(_receiverAddress, _amount)
        .signAndSend(_senderKeyring, async (result) => {
          let txFailed = false;
          let failedTxStatusText = '';

          if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(result.dispatchError.asModule);
              const { docs, name, section } = decoded;

              txFailed = true;
              failedTxStatusText = `${docs.join(' ')}`;

              console.log(` ${section}.${name}: ${docs.join(' ')}`);
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              // failedTxStatusText = result.dispatchError.toString();
              console.log(result.dispatchError.toString());
            }
          }

          if (result.status.isInBlock) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            const signedBlock = await api.rpc.chain.getBlock(result.status.asInBlock);
            const blockNumber = signedBlock.block.header.number.toHuman();

            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            setTxStatus({ blockNumber: String(blockNumber), success: null, text: 'INCLUDED' });
          } else if (result.status.isFinalized) {
            const signedBlock = await api.rpc.chain.getBlock(result.status.asFinalized);
            const blockNumber = signedBlock.block.header.number.toHuman();

            if (txFailed) {
              setTxStatus({ blockNumber: String(blockNumber), success: false, text: failedTxStatusText });
            } else {
              setTxStatus({ blockNumber: String(blockNumber), success: true, text: 'FINALIZED' });
            }

            const senderAddres = _senderKeyring.address;

            // the hash for each extrinsic in the block
            signedBlock.block.extrinsics.forEach((ex) => {
              if (ex.isSigned) {
                if (ex.signer.toString() === senderAddres) {
                  const txHash = ex.hash.toHex();

                  resolve(txHash);
                }
              }
            });
          }
        });
    } catch (e) {
      console.log('something went wrong while sign and transfe!');
      setTxStatus({ blockNumber: null, success: false, text: `Failed: ${e}` });
      resolve('');
    }
  });
}

// transfer().catch(console.error).finally(() => process.exit());
