// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationType } from '@subwallet/extension-koni-ui/stores/base/RequestState';
import { AccountSignMode } from '@subwallet/extension-koni-ui/types/account';

export const MODE_CAN_SIGN: AccountSignMode[] = [AccountSignMode.PASSWORD, AccountSignMode.QR, AccountSignMode.LEGACY_LEDGER, AccountSignMode.GENERIC_LEDGER];

export const NEED_SIGN_CONFIRMATION: ConfirmationType[] = ['evmSignatureRequest', 'evmSendTransactionRequest', 'signingRequest'];
