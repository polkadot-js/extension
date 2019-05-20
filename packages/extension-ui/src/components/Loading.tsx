// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';

type Props = {
  children?: React.ReactNode
};

export default function Loading ({ children }: Props) {
  if (!children) {
    return (
      <div>... loading ...</div>
    );
  }

  return (
    <>{children}</>
  );
}
