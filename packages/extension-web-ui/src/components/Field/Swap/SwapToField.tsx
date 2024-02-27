// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { InputRef } from '@subwallet/react-ui';
import React, { ForwardedRef, forwardRef } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  //
}

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  return (
    <>

    </>
  );
};

const SwapToField = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default SwapToField;
