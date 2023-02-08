// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import RequestService from '@subwallet/extension-base/services/request-service';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { KoniSigningTransaction, KoniTransaction, KoniTransactionStatus } from '@subwallet/extension-base/services/transaction-service/types';
import { BehaviorSubject } from 'rxjs';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

const convertToBrief = ({ address,
  createdAt,
  data,
  extrinsicHash,
  id,
  network,
  payload,
  status,
  updatedAt }: KoniTransaction): KoniSigningTransaction => {
  return {
    address,
    createdAt,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    extrinsicHash,
    id,
    network,
    payload,
    status,
    updatedAt
  };
};

export default class TransactionService {
  readonly #dbService: DatabaseService;
  readonly #requestService: RequestService;
  readonly #logger: Logger;
  readonly #transactions: Record<string, KoniTransaction> = {};
  public readonly transactionSubject: BehaviorSubject<KoniSigningTransaction[]> = new BehaviorSubject<KoniSigningTransaction[]>([]);

  constructor (dbService: DatabaseService, requestService: RequestService) {
    this.#dbService = dbService;
    this.#requestService = requestService;

    this.#logger = createLogger('TransactionService');
  }

  private get allTransactions (): KoniSigningTransaction[] {
    return Object.values(this.#transactions).map(convertToBrief);
  }

  private validTransaction (transaction: KoniTransaction): boolean {
    const transactions = this.allTransactions;
    const filtered = transactions
      .filter((item) => item.address === transaction.address && item.network === transaction.network);

    return !filtered.some((item) => item.status === KoniTransactionStatus.PENDING);
  }

  public notice (message: string): void {
    this.#logger.log(message);
  }

  public addTransaction (transaction: KoniTransaction): void {
    const idValid = this.validTransaction(transaction);

    if (!idValid) {
      this.#logger.log('Invalid transaction');
      throw new Error('Invalid transaction');
    }

    this.#transactions[transaction.id] = transaction;
  }

  public sendTransactionRequest (id: string): void {
    const transaction = this.#transactions[id];

    if (!transaction.resolve || !transaction.reject) {
      this.#logger.log('Invalid transaction');
      throw new Error('Invalid transaction');
    }

    this.#requestService.addFromTransaction(transaction);
  }

  public resendTransaction (id: string): void {
    const transaction = this.#transactions[id];

    if (!transaction.sendRequest) {
      this.#logger.log('Invalid transaction');
      throw new Error('Invalid transaction');
    }

    transaction.sendRequest();
  }

  public getTransaction (id: string): KoniSigningTransaction {
    return convertToBrief(this.#transactions[id]);
  }
}
