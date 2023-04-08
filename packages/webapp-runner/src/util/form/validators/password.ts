// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormRule } from "@subwallet-webapp/types";

export const MinPasswordLength = 6;

export const renderBasePasswordRules = (fieldName: string): FormRule[] => {
  return [
    {
      message: `${fieldName} is too short`,
      min: MinPasswordLength,
    },
    {
      message: `${fieldName} is required`,
      required: true,
    },
  ];
};

export const renderBaseConfirmPasswordRules = (
  passwordFieldName: string
): FormRule[] => {
  return [
    ({ getFieldValue }) => ({
      validator: (_, value) => {
        const password = getFieldValue(passwordFieldName) as string;

        if (!value || password === value) {
          return Promise.resolve();
        }

        return Promise.reject(new Error("Passwords do not match!"));
      },
    }),
  ];
};
