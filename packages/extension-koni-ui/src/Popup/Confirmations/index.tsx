// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps

const Component = function ({ className }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const confirmations = useSelector((state: RootState) => (state.requestState));

  return <div className={className}>
    {currentIndex + 1}
  </div>;
};

const Confirmations = styled(Component)(({ theme }) => ({
  backgroundColor: 'indianred'
}));

export default Confirmations;
