// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import useTranslation from '../hooks/useTranslation';

interface Props {
  children?: React.ReactNode;
}

export default function Loading ({ children }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  if (!children) {
    return (
      <div>{t<string>('... loading ...')}</div>
    );
  }

  return (
    <>{children}</>
  );
}
