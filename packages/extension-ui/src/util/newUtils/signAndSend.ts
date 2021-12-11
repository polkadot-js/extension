// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { ISubmittableResult } from '@polkadot/types/types';

import { TxInfo } from './pjpeTypes';

export async function signAndSend(
  api: ApiPromise,
  submittable: SubmittableExtrinsic<'promise', ISubmittableResult>,
  _signer: KeyringPair): Promise<TxInfo> {
  return new Promise((resolve) => {

    console.log(`signing and sending a tx ...`)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    submittable.signAndSend(_signer, async (result) => {
      let txFailed = false;
      let failureText: string;
      console.log(`submitted a tx ...`)

      if (result.dispatchError) {
        if (result.dispatchError.isModule) {
          // for module errors, we have the section indexed, lookup
          const decoded = api.registry.findMetaError(result.dispatchError.asModule);
          const { docs, name, section } = decoded;

          txFailed = true;
          failureText = `${docs.join(' ')}`;

          console.log(` ${section}.${name}: ${docs.join(' ')}`);
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          console.log(result.dispatchError.toString());
        }
      }

      if (result.status.isFinalized) {
        const signedBlock = await api.rpc.chain.getBlock(result.status.asFinalized);

        const senderAddres = _signer.address;

        let txHash = '';

        // seatch for the hash of the extrinsic in the block
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        signedBlock.block.extrinsics.forEach(async (ex) => {
          if (ex.isSigned) {
            if (ex.signer.toString() === senderAddres) {
              txHash = ex.hash.toHex();

              const queryInfo = await api.rpc.payment.queryInfo(ex.toHex(), signedBlock.block.hash);
              const fee = queryInfo.partialFee.toString();

              resolve({ failureText: failureText, fee: fee, status: txFailed ? 'failed' : 'success', txHash: txHash });
            }
          }
        });
      }
    });
  });
}
