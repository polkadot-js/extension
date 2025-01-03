// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation as useTranslationBase } from 'react-i18next';

export type TFunction = (key: string, options?: { replace: Record<string, string | number> }) => string;

interface UseTranslation {
  t: TFunction
}

export default function useTranslation (): UseTranslation {
  return useTranslationBase();
}
