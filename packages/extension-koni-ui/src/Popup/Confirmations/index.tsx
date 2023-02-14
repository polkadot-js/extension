// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps

const Component = function ({ className }: Props) {
  const { numberOfConfirmations } = useSelector((state: RootState) => (state.requestState));
  // const [currentIndex, setCurrentIndex] = useState(0);

  return <div className={className}>
    {numberOfConfirmations}
  </div>;
};

const Confirmations = styled(Component)(({ theme }) => ({
  backgroundColor: 'gray'
}));

export default Confirmations;
