// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseTransfer, TransferErrorCode, TransferStep } from '@polkadot/extension-base/background/KoniTypes';
import { state } from '@polkadot/extension-koni-base/background/handlers';
import { KeyringPair } from '@polkadot/keyring/types';
import { EventRecord, SignedBlockWithJustifications } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

export async function estimateFee (networkKey: string, fromKeypair: KeyringPair | undefined, to: string, value: string | undefined, transferAll: boolean): Promise<string> {
  const dotSamaApiMap = state.getApiMap().dotSama;
  const apiProps = await dotSamaApiMap[networkKey].isReady;

  if (fromKeypair === undefined) {
    return '0';
  }

  if (transferAll) {
    const paymentInfo = await apiProps.api.tx.balances.transferAll(to, false).paymentInfo(fromKeypair);

    return paymentInfo.partialFee.toString();
  } else if (value) {
    const paymentInfo = await apiProps.api.tx.balances.transfer(to, new BN(value)).paymentInfo(fromKeypair);

    return paymentInfo.partialFee.toString();
  }

  return '0';
}

export async function makeTransfer (networkKey: string, to: string, fromKeypair: KeyringPair, value: string, transferAll: boolean, callback: (data: ResponseTransfer) => void): Promise<void> {
  const dotSamaApiMap = state.getApiMap().dotSama;
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;
  // @ts-ignore
  const { nonce } = await api.query.system.account(fromKeypair.address);

  let transfer;

  if (transferAll) {
    transfer = api.tx.balances.transferAll(to, false);
  } else {
    transfer = api.tx.balances.transfer(to, new BN(value));
  }

  const response: ResponseTransfer = {
    step: TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  function updateResponseByEvents (response: ResponseTransfer, events: EventRecord[]) {
    events.forEach(({ event: { method, section, data: [error, info] } }) => {
      // @ts-ignore
      const isFailed = section === 'system' && method === 'ExtrinsicFailed';
      // @ts-ignore
      const isSuccess = section === 'system' && method === 'ExtrinsicSuccess';

      console.log('Transaction final: ', isFailed, isSuccess);

      if (isFailed) {
        response.step = TransferStep.ERROR;

        // @ts-ignore
        if (error.isModule) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const decoded = api.registry.findMetaError(error.asModule);
          const { docs, method, section } = decoded;

          const errorMesssage = docs.join(' ');

          console.log(`${section}.${method}: ${errorMesssage}`);
          response.data = {
            section,
            method,
            message: errorMesssage,
            info
          };
          response.errors?.push({
            code: TransferErrorCode.TRANSFER_ERROR,
            message: errorMesssage
          });
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          console.log(error.toString());
          response.errors?.push({
            code: TransferErrorCode.TRANSFER_ERROR,
            message: error.toString()
          });
        }
      } else if (isSuccess) {
        response.step = TransferStep.SUCCESS;
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  await transfer.signAndSend(fromKeypair, { nonce }, ({ events = [], status }) => {
    console.log('Transaction status:', status.type, status.hash.toHex());
    response.extrinsicStatus = status.type;

    if (status.isBroadcast) {
      response.step = TransferStep.START;
    }

    if (status.isInBlock) {
      const blockHash = status.asInBlock.toHex();

      response.step = TransferStep.PROCESSING;
      response.data = {
        block: blockHash,
        status: status.type
      };

      // updateResponseByEvents(response, events);
      callback(response);
    } else if (status.isFinalized) {
      const blockHash = status.asFinalized.toHex();

      response.data = {
        block: blockHash,
        status: status.type
      };

      updateResponseByEvents(response, events);

      const extrinsicIndex = parseInt(events[0]?.phase.asApplyExtrinsic.toString());

      // Get extrinsic hash from network
      api.rpc.chain.getBlock(blockHash)
        .then((blockQuery: SignedBlockWithJustifications) => {
          response.extrinsicHash = blockQuery.block.extrinsics[extrinsicIndex].hash.toHex();
          callback(response);
        })
        .catch((e) => {
          console.error('Transaction errors:', e);
          callback(response);
        });
    } else {
      callback(response);
    }
  });
}
