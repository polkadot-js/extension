// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { useTranslation } from '../hooks/index.js';

interface Props {
  children?: React.ReactNode;
}

export default function Loading ({ children }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  if (!children) {
    return (
      <div>{t('... loading ...')}</div>
    );
  }

  return (
    <>{children}</>
  );
}
