// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function BondingValidatorSelection ({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      Validator selection
    </div>
  );
}

export default React.memo(styled(BondingValidatorSelection)(({ theme }: Props) => `
`));
