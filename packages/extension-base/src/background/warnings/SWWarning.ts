// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export class SWWarning {
  warningType: string;
  code: number | undefined;
  message: string;
  data: unknown | undefined;

  constructor (warningType: string, message: string, code?: number, data?: unknown) {
    this.message = message;
    this.warningType = warningType;
    this.code = code;
    this.data = data;
  }
}
