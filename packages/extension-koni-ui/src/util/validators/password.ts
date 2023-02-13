// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ValidateState, ValidateStatus } from '@subwallet/extension-koni-ui/types/validator';

interface PasswordLengthValidator {
  status?: ValidateStatus;
  minLength?: number;
  errorText?: string;
  tooltip?: `${string}$min${string}` | string;
}

const DEFAULT_LENGTH_VALIDATOR: PasswordLengthValidator = {
  status: 'warning',
  minLength: 6,
  errorText: 'Password is too short',
  tooltip: 'Password required at least $min character'
}
export const passwordValidateLength = (validator?: PasswordLengthValidator): ((value: string) => null | ValidateState) => {
  const {
    status = 'warning',
    minLength = 6,
    errorText = 'Password is too short',
    tooltip = 'Password required at least $min character'
  } = Object.assign({}, DEFAULT_LENGTH_VALIDATOR, validator);
  return (value: string) => {
    if (value.length < minLength) {
      return {
        status: status,
        message: errorText,
        tooltip: tooltip.replace('$min', minLength.toString()),
      }
    } else {
      return null;
    }
  }
}
