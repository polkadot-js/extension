// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmRpcError } from '@subwallet/extension-base/background/errors/EvmRpcError';
import { ChainType, EvmSendTransactionRequest } from '@subwallet/extension-base/background/KoniTypes';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import NotificationService from '@subwallet/extension-base/services/notification-service/NotificationService';
import RequestService from '@subwallet/extension-base/services/request-service';
import { EXTENSION_REQUEST_URL } from '@subwallet/extension-base/services/request-service/constants';
import { getTransactionId } from '@subwallet/extension-base/services/transaction-service/helpers';
import { KoniTransactionStatus, SendTransactionEvents, SWTransaction, SWTransactionInput, TransactionEmitter, TransactionEventResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { Web3Transaction } from '@subwallet/extension-base/signers/types';
import { anyNumberToBN } from '@subwallet/extension-base/utils/eth';
import { parseTxAndSignature } from '@subwallet/extension-base/utils/eth/mergeTransactionAndSignature';
import EventEmitter from 'eventemitter3';
import { BehaviorSubject } from 'rxjs';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { Signer, SignerResult } from '@polkadot/api/types';
import { SignerPayloadJSON } from '@polkadot/types/types/extrinsic';
import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export default class TransactionService {
  private readonly chainService: ChainService;
  private readonly requestService: RequestService;
  private readonly logger: Logger;

  public readonly transactionSubject: BehaviorSubject<Record<string, SWTransaction>> = new BehaviorSubject<Record<string, SWTransaction>>({});

  private get transactions (): Record<string, SWTransaction> {
    return this.transactionSubject.getValue();
  }

  constructor (chainService: ChainService, requestService: RequestService) {
    this.chainService = chainService;
    this.requestService = requestService;

    this.logger = createLogger('TransactionService');
  }

  private get allTransactions (): SWTransaction[] {
    return Object.values(this.transactions);
  }

  private get pendingTransactions (): SWTransaction[] {
    return this.allTransactions.filter((t) => t.status === 'PENDING');
  }

  private getTransaction (id: string) {
    return this.transactions[id];
  }

  private validateTransaction (transaction: SWTransaction): boolean {
    // Check duplicated transaction
    const existed = this.pendingTransactions
      .filter((item) => item.address === transaction.address && item.chain === transaction.chain);

    return !(existed.length > 0);
  }

  public notice (message: string): void {
    this.logger.log(message);
  }

  fillTransactionDefaultInfo (transaction: SWTransactionInput): SWTransaction {
    const isInternal = !transaction.url;

    return {
      ...transaction,
      createdAt: new Date(),
      updatedAt: new Date(),
      url: transaction.url || EXTENSION_REQUEST_URL,
      status: KoniTransactionStatus.PENDING,
      isInternal,
      id: getTransactionId(transaction.chainType, transaction.chain, isInternal),
      extrinsicHash: ''
    } as SWTransaction;
  }

  public async addTransaction (inputTransaction: SWTransactionInput): Promise<TransactionEmitter> {
    // Fill transaction default info
    const transaction = this.fillTransactionDefaultInfo(inputTransaction);

    // Validate Transaction
    const idValid = this.validateTransaction(transaction);

    if (!idValid) {
      this.logger.log('Invalid transaction');
      throw new Error('Invalid transaction');
    }

    // Add Transaction
    this.transactions[transaction.id] = transaction;
    this.transactionSubject.next({ ...this.transactions });

    // Send transaction
    return await this.sendTransaction(transaction);
  }

  public async sendTransaction (transaction: SWTransaction): Promise<TransactionEmitter> {
    // Send Transaction
    const emitter = transaction.chainType === 'substrate' ? this.signAndSendSubstrateTransaction(transaction) : (await this.signAndSendEvmTransaction(transaction));

    emitter.on('extrinsicHash', (data: TransactionEventResponse) => {
      this.onHasTransactionHash(data);
    });

    emitter.on('success', (data: TransactionEventResponse) => {
      this.onSuccess(data);
    });

    emitter.on('error', (data: TransactionEventResponse) => {
      this.onFailed({ ...data, error: data.error || new Error('Unknown error') });
    });

    return emitter;
  }

  public removeTransaction (id: string): void {
    if (this.transactions[id]) {
      delete this.transactions[id];
      this.transactionSubject.next({ ...this.transactions });
    }
  }

  public updateTransaction (id: string, data: Partial<Omit<SWTransaction, 'id'>>): void {
    const transaction = this.transactions[id];

    if (transaction) {
      this.transactions[id] = {
        ...transaction,
        ...data
      };
    }
  }

  private getTransactionLink (id: string): string | undefined {
    const transaction = this.getTransaction(id);
    const chainInfo = this.chainService.getChainInfoByKey(transaction.chain);

    if (transaction.chainType === ChainType.EVM) {
      const explorerLink = chainInfo?.evmInfo?.blockExplorer;

      if (explorerLink) {
        return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}tx/${transaction.extrinsicHash}`);
      }
    } else {
      const explorerLink = chainInfo?.substrateInfo?.blockExplorer;

      if (explorerLink) {
        return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}extrinsic/${transaction.extrinsicHash}`);
      }
    }

    return undefined;
  }

  private onHasTransactionHash ({ extrinsicHash, id }: TransactionEventResponse) {
    // Todo: Write pending transaction history
    this.updateTransaction(id, { extrinsicHash });
    console.log(`Transaction "${id}" is submitted with hash ${extrinsicHash || ''}`);
  }

  private onSuccess ({ id }: TransactionEventResponse) {
    // Todo: Write success transaction history
    const transaction = this.getTransaction(id);

    this.updateTransaction(id, { status: KoniTransactionStatus.COMPLETED });
    console.log('Transaction completed', id, transaction.extrinsicHash);
    NotificationService.createNotification('Transaction completed', `Transaction ${transaction?.extrinsicHash} completed`, this.getTransactionLink(id));
  }

  private onFailed ({ error, id }: TransactionEventResponse) {
    // Todo: Write failed transaction history
    const transaction = this.getTransaction(id);

    if (transaction) {
      this.updateTransaction(id, { status: KoniTransactionStatus.FAILED, errors: [error?.message || 'Unknown error'] });
      console.log('Transaction failed', id, transaction.extrinsicHash);
      NotificationService.createNotification('Transaction failed', `Transaction ${transaction?.extrinsicHash} failed`, this.getTransactionLink(id));
    }

    console.error(error);
  }

  private async signAndSendEvmTransaction ({ address, chain, id, transaction, url }: SWTransaction): Promise<TransactionEmitter> {
    const payload = (transaction as EvmSendTransactionRequest);

    const { account } = payload;

    // Set unique nonce to avoid transaction errors
    if (!payload.nonce) {
      const evmApi = this.chainService.getEvmApi(chain);

      payload.nonce = await evmApi.api.eth.getTransactionCount(address);
    }

    if (!payload.chainId) {
      const chainInfo = this.chainService.getChainInfoByKey(chain);

      payload.chainId = chainInfo.evmInfo?.evmChainId ?? 1;
    }

    // Auto fill from
    if (!payload.from) {
      payload.from = address;
    }

    const isExternal = !!account.isExternal;

    const emitter = new EventEmitter<SendTransactionEvents, TransactionEventResponse>();

    const txObject: Web3Transaction = {
      nonce: payload.nonce || 1,
      from: payload.from as string,
      gasPrice: anyNumberToBN(payload.gasPrice).toNumber(),
      gasLimit: anyNumberToBN(payload.gas).toNumber(),
      to: payload.to !== undefined ? payload.to : '',
      value: anyNumberToBN(payload.value).toNumber(),
      data: payload.data ? payload.data : '',
      chainId: payload.chainId
    };

    this.requestService.addConfirmation(id, url || EXTENSION_REQUEST_URL, 'evmSendTransactionRequest', payload, {})
      .then(({ isApproved, payload }) => {
        if (isApproved) {
          let signedTransaction: string | undefined;

          if (!payload) {
            throw new EvmRpcError('UNAUTHORIZED', 'Bad signature');
          }

          const web3Api = this.chainService.getEvmApi(chain).api;

          if (!isExternal) {
            signedTransaction = payload;
          } else {
            const signed = parseTxAndSignature(txObject, payload as `0x${string}`);

            const recover = web3Api.eth.accounts.recoverTransaction(signed);

            if (recover.toLowerCase() !== account.address.toLowerCase()) {
              throw new EvmRpcError('UNAUTHORIZED', 'Bad signature');
            }

            signedTransaction = signed;
          }

          signedTransaction && web3Api.eth.sendSignedTransaction(signedTransaction)
            .once('transactionHash', (hash) => {
              emitter.emit('extrinsicHash', { id, extrinsicHash: hash });
            })
            .once('receipt', (rs) => {
              emitter.emit('success', { id, transactionHash: rs.transactionHash });
            })
            .once('error', (e) => {
              emitter.emit('error', { id, error: e });
            })
            .catch((e: Error) => {
              emitter.emit('error', { id, error: e });
            });
        } else {
          this.removeTransaction(id);
          emitter.emit('error', new EvmRpcError('USER_REJECTED_REQUEST', 'User Rejected'));
        }
      })
      .catch((e: Error) => {
        this.removeTransaction(id);
        emitter.emit('error', { id, error: e });
      });

    return emitter;
  }

  private signAndSendSubstrateTransaction ({ address, id, transaction, url }: SWTransaction): TransactionEmitter {
    const emitter = new EventEmitter<SendTransactionEvents, TransactionEventResponse>();

    (transaction as SubmittableExtrinsic).signAsync(address, {
      signer: {
        signPayload: async (payload: SignerPayloadJSON) => {
          const signing = await this.requestService.signInternalTransaction(id, url || EXTENSION_REQUEST_URL, address, payload);

          return {
            id: (new Date()).getTime(),
            signature: signing.signature
          } as SignerResult;
        }
      } as Signer
    }).then((rs) => {
      // Todo: Handle and emit event from runningTransaction
      rs.send().then((result) => {
        emitter.emit('extrinsicHash', { id, extrinsicHash: result.toHex() });
      }).then(() => {
        emitter.emit('success', { id });
      }).catch((e: Error) => {
        emitter.emit('error', { id, error: e });
      });
    }).catch((e: Error) => {
      this.removeTransaction(id);
      emitter.emit('error', { id, error: e });
    });

    return emitter;
  }
}
