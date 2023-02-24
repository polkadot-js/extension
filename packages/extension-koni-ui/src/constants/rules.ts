// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Rule } from 'rc-field-form/lib/interface';

export const MinPasswordLength = 6;

export const renderBasePasswordRules = (fieldName: string): Rule[] => {
  return [
    {
      message: `${fieldName} is too short`,
      min: MinPasswordLength
    },
    {
      message: `${fieldName} is required`,
      required: true
    }
  ];
};

export const renderBaseConfirmPasswordRules = (passwordFieldName: string): Rule[] => {
  return [
    ({ getFieldValue }) => ({
      validator: (_, value) => {
        const password = getFieldValue(passwordFieldName) as string;

        if (!value || password === value) {
          return Promise.resolve();
        }

        return Promise.reject(new Error('Passwords do not match!'));
      }
    })
  ];
};
