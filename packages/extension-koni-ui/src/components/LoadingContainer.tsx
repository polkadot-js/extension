// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import Loading from '@polkadot/extension-koni-ui/components/Loading';

interface Props {
  children?: React.ReactNode
  className?: 'string';
}

export default function LoadingContainer ({ children, className }: Props): React.ReactElement<Props> {
  if (!children) {
    return (
      <div className={className}>
        <Loading />
      </div>
    );
  }

  return (
    <>{children}</>
  );
}
