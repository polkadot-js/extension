// Copyright 2019-2022 @polkadot/extension-mocks authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

interface useTranslationReturnObj {
  i18n: { changeLanguage: () => Promise<unknown>; };
  t: (str: string) => string;
}

export const useTranslation = (): useTranslationReturnObj => {
  return {
    i18n: {
      changeLanguage: () => new Promise(() => { /**/ })
    },
    t: (str: string) => str
  };
};

export const withTranslation = () => (component: React.ReactElement): React.ReactElement => component;

export const Trans = ({ children }: { children: React.ReactElement }): React.ReactElement => children;

export default withTranslation;
