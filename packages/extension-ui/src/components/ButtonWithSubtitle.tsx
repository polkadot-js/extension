// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { Button } from '.';
import styled from 'styled-components';

interface ButtonWithSubtitleProps {
  title: string;
  subTitle: string;
  children?: string;
  to: string;
}

export default function ButtonWithSubtitle ({ children, subTitle, title, to }: ButtonWithSubtitleProps): React.ReactElement<ButtonWithSubtitleProps> {
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
    font-weight: 400;
    font-size: 15px;
    line-height: 20px;
  }

  span {
    display: block;
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
  }
`;
