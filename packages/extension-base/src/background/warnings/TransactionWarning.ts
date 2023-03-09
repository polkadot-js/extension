// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionWarningType } from '@subwallet/extension-base/background/KoniTypes';
import { SWWarning } from '@subwallet/extension-base/background/warnings/SWWarning';

export class TransactionWarning extends SWWarning {
  override warningType: TransactionWarningType;

  constructor (warningType: TransactionWarningType, message: string, code?: number, data?: unknown) {
    super(warningType, message, code, data);
    this.warningType = warningType;
  }
}
