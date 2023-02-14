// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ValidateStatus as _ValidateStatus } from '@subwallet/react-ui/es/form/FormItem';

export type ValidateStatus = _ValidateStatus;

export interface ValidateState {
  status?: ValidateStatus;
  message?: string;
  tooltip?: string;
}
