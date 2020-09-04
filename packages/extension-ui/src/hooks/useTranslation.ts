// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

interface TranslationOptions {
  replace: Record<string, string | number>
}

interface Translation {
  t: (key: string, options?: TranslationOptions) => string;
}

const defaultTranslation: Translation = {
  t: (key: string, { replace }: TranslationOptions = { replace: {} }) =>
    Object.entries(replace).reduce((result: string, [rk, rv]) => result.replace(`{{${rk}}}`, `${rv}`), key)
};

export default function useTranslation (): Translation {
  return defaultTranslation;
}
