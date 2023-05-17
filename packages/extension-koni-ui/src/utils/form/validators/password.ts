// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormRule } from '@subwallet/extension-koni-ui/types';

export const MinPasswordLength = 8;

// (?=.*\d): should contain at least one digit
// (?=.*[a-z]): should contain at least one lower case
// (?=.*[A-Z]): should contain at least one upper case
// (?=.*[~!@#$%^&*]): should contain at least one special character in listed
// [A-Za-z\d~!@#$%^&*]{8,}: should contain at least 8 from the mentioned characters

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~!@#$%^&*])[A-Za-z\d~!@#$%^&*]{8,}$/;

export const renderBasePasswordRules = (fieldName: string): FormRule[] => {
  return [
    {
      message: `${fieldName} is too short`,
      min: MinPasswordLength
    },
    {
      message: `${fieldName} is required`,
      required: true
    },
    {
      message: `${fieldName} should be at least 1 uppercase letter, 1 number, and 1 special character`,
      pattern: passwordRegex,
      warningOnly: true
    }
  ];
};

export const renderBaseConfirmPasswordRules = (passwordFieldName: string): FormRule[] => {
  return [
    ({ getFieldValue }) => ({
      validator: (_, value) => {
        const password = getFieldValue(passwordFieldName) as string;

        if (!value || password === value) {
          return Promise.resolve();
        }

        return Promise.reject(new Error('Passwords do not match!'));
      }
    }),
    {
      message: `${passwordFieldName} should be at least 1 uppercase letter, 1 number, and 1 special character`,
      pattern: passwordRegex,
      warningOnly: true
    }
  ];
};
