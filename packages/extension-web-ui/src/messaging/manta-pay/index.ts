// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MantaPayConfig, MantaPayEnableParams, MantaPaySyncState, ResolveDomainRequest } from '@subwallet/extension-base/background/KoniTypes';

import { sendMessage } from '../base';

export async function enableMantaPay (params: MantaPayEnableParams) {
  return sendMessage('pri(mantaPay.enable)', params);
}

export async function disableMantaPay (address: string) {
  return sendMessage('pri(mantaPay.disable)', address);
}

export async function getMantaZkBalance () {
  return sendMessage('pri(mantaPay.getZkBalance)', null);
}

export async function subscribeMantaPayConfig (callback: (data: MantaPayConfig[]) => void): Promise<MantaPayConfig[]> {
  return sendMessage('pri(mantaPay.subscribeConfig)', null, callback);
}

export async function subscribeMantaPaySyncingState (callback: (progress: MantaPaySyncState) => void): Promise<MantaPaySyncState> {
  return sendMessage('pri(mantaPay.subscribeSyncingState)', null, callback);
}

export async function initSyncMantaPay (address: string) {
  return sendMessage('pri(mantaPay.initSyncMantaPay)', address);
}

export async function resolveDomainToAddress (request: ResolveDomainRequest) {
  return sendMessage('pri(accounts.resolveDomainToAddress)', request);
}
