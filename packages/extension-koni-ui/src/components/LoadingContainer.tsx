// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import Loading from '@polkadot/extension-koni-ui/components/Loading';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  children?: React.ReactNode
  className?: 'string';
}

function LoadingContainer ({ children, className }: Props): React.ReactElement<Props> {
  if (!children) {
    return (
      <div className={className}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default React.memo(styled(LoadingContainer)(({ theme }: Props) => ''));
