// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationType } from '@subwallet/extension-web-ui/stores/base/RequestState';
import { AccountSignMode } from '@subwallet/extension-web-ui/types/account';

export const MODE_CAN_SIGN: AccountSignMode[] = [AccountSignMode.PASSWORD, AccountSignMode.QR, AccountSignMode.LEDGER];

export const NEED_SIGN_CONFIRMATION: ConfirmationType[] = ['evmSignatureRequest', 'evmSendTransactionRequest', 'signingRequest'];
