// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestAccountMeta, RequestParseTransactionSubstrate, RequestQrSignEvm, RequestQrSignSubstrate, ResponseAccountIsLocked, ResponseAccountMeta, ResponseParseTransactionSubstrate, ResponseQrParseRLP, ResponseQrSignEvm, ResponseQrSignSubstrate } from '@subwallet/extension-base/background/KoniTypes';

import { sendMessage } from '../base';

export async function accountIsLocked (address: string): Promise<ResponseAccountIsLocked> {
  return sendMessage('pri(account.isLocked)', { address });
}

export async function qrSignSubstrate (request: RequestQrSignSubstrate): Promise<ResponseQrSignSubstrate> {
  return sendMessage('pri(qr.sign.substrate)', request);
}

export async function qrSignEvm (request: RequestQrSignEvm): Promise<ResponseQrSignEvm> {
  return sendMessage('pri(qr.sign.evm)', request);
}

export async function parseSubstrateTransaction (request: RequestParseTransactionSubstrate): Promise<ResponseParseTransactionSubstrate> {
  return sendMessage('pri(qr.transaction.parse.substrate)', request);
}

export async function parseEVMTransaction (data: string): Promise<ResponseQrParseRLP> {
  return sendMessage('pri(qr.transaction.parse.evm)', { data });
}

export async function getAccountMeta (request: RequestAccountMeta): Promise<ResponseAccountMeta> {
  return sendMessage('pri(accounts.get.meta)', request);
}
