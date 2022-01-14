// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation as useTranslationBase, UseTranslationResponse, withTranslation } from 'react-i18next';

export function useTranslation (): UseTranslationResponse<string, undefined> {
  return useTranslationBase();
}

export default withTranslation();
