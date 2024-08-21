// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationType, RequestSigningApprovePasswordV2 } from '@subwallet/extension-base/background/KoniTypes';
import { ResponseSigningIsLocked } from '@subwallet/extension-base/background/types';

import { HexString } from '@polkadot/util/types';

import { sendMessage } from '../base';

export async function cancelSignRequest (id: string): Promise<boolean> {
  return sendMessage('pri(signing.cancel)', { id });
}

export async function isSignLocked (id: string): Promise<ResponseSigningIsLocked> {
  return sendMessage('pri(signing.isLocked)', { id });
}

export async function approveSignPassword (id: string, savePass: boolean, password?: string): Promise<boolean> {
  return sendMessage('pri(signing.approve.password)', { id, password, savePass });
}

export async function approveSignPasswordV2 (request: RequestSigningApprovePasswordV2): Promise<boolean> {
  return sendMessage('pri(signing.approve.passwordV2)', request);
}

export async function approveSignSignature (id: string, signature: HexString, signedTransaction?: HexString): Promise<boolean> {
  return sendMessage('pri(signing.approve.signature)', { id, signature, signedTransaction });
}

export async function completeConfirmation<CT extends ConfirmationType> (type: CT, payload: ConfirmationDefinitions[CT][1]): Promise<boolean> {
  return sendMessage('pri(confirmations.complete)', { [type]: payload });
}
