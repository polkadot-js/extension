// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function MenuDivider ({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={className} />
  );
}

export default styled(MenuDivider)(({ theme }: Props) => `
  padding-top: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid ${theme.inputBorderColor};
`);
