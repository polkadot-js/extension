// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import Loading from '@polkadot/extension-koni-ui/components/Loading';

interface Props {
  children?: React.ReactNode
  className?: 'string';
}

function LoadingContainer ({ children, className }: Props): React.ReactElement<Props> {
  if (!children) {
    return (
      <Loading className={className} />
    );
  }

  return (
    <>{children}</>
  );
}

export default styled(LoadingContainer)`
  position: relative;
  height: 100%;

  img {
    width: 120px;
    height: 120px;
    margin: auto;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
`;
