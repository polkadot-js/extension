// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';

import useTranslation from '../hooks/useTranslation';

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
