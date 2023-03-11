// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

let transactionCount = 0;
let validationCount = 0;

export const getTransactionId = (chainType: string, chain: string, isInternal: boolean): string => {
  return `${isInternal ? 'internal' : 'external'}.${chainType}.${chain}.${Date.now()}.${++transactionCount}`;
};

export const getValidationId = (chainType: string, chain: string): string => {
  return `${chainType}.${chain}.${Date.now()}.${++validationCount}`;
};
