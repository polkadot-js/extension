// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  percent: number
}

const Component = ({ className, percent }: Props) => {
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    requestAnimationFrame(() => {
      setWidth(percent);
    });
  }, [percent]);

  return (
    <div
      className={className}
    >
      <div
        className='__progress-value'
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export const ProgressBar = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    borderRadius: token.borderRadiusXS,
    height: token.sizeXS,
    backgroundColor: token.colorBgInput,

    '.__progress-value': {
      transition: 'width 0.9s',
      borderRadius: token.borderRadiusSM,
      backgroundColor: token['geekblue-6']
    }
  };
});
