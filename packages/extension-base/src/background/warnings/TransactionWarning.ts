// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxWarningCode, TransactionWarningType } from '@subwallet/extension-base/background/KoniTypes';
import { SWWarning } from '@subwallet/extension-base/background/warnings/SWWarning';

const defaultWarningMap: Record<TransactionWarningType, string> = {
  [BasicTxWarningCode.NOT_ENOUGH_EXISTENTIAL_DEPOSIT]: 'Not enough existential deposit'
};

export class TransactionWarning extends SWWarning {
  override warningType: TransactionWarningType;

  constructor (warningType: TransactionWarningType, message?: string, code?: number, data?: unknown) {
    const warningMessage = message || defaultWarningMap[warningType] || warningType;

    super(warningType, warningMessage, code, data);
    this.warningType = warningType;
  }
}
