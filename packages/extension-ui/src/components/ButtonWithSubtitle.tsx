// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import { Button } from '.';
import styled from 'styled-components';

interface ButtonWithSubtitleProps {
  title: string;
  subTitle: string;
  children?: string;
  to: string;
}

export default function ButtonWithSubtitle ({ title, subTitle, children, to }: ButtonWithSubtitleProps): React.ReactElement<ButtonWithSubtitleProps> {
  return (
    <StyledButton to={to}>
      <p>{title}</p>
      <span>{subTitle}</span>
      {children}
    </StyledButton>
  );
}

const StyledButton = styled(Button)`
  button {
    padding-top: 0;
    padding-bottom: 0;
  }
  p {
    margin: 0;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;
  }
  span {
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
  }
`;
