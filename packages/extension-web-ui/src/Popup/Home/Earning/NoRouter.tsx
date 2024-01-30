// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useGetYieldPositions } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const navigate = useNavigate();

  const yieldPositions = useGetYieldPositions();

  useEffect(() => {
    if (yieldPositions.length) {
      navigate('/home/earning/detail', { replace: true });
    } else {
      navigate('/home/earning/overview', { replace: true });
    }
  }, [yieldPositions.length, navigate]);

  return (
    <div className={CN(className)}>
      {/*  Empty  */}
    </div>
  );
};

const NoRouter = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default NoRouter;
