// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      Earning
    </div>
  );
}

const Earning = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});

export default Earning;
