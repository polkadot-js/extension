// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import warningIcon from '../assets/warning.svg';
import { ThemeProps } from '../types';
import Svg from './Svg';

interface Props extends ThemeProps {
  className?: string;
  title: string;
  description: string;
}

function WarningBox({ className, description, title }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <Svg
        className='icon'
        src={warningIcon}
      />
      <div className='text-container'>
        <span className='title'>{title}</span>
        <span className='description'>{description}</span>
      </div>
    </div>
  );
}

export default styled(WarningBox)(
  ({ theme }: Props) => `
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  color: ${theme.warningColor};
  border: 2px solid ${theme.warningColor};
  border-radius: 4px;
  background: ${theme.warningBoxBackground};
  padding: 14px;
  gap: 10px;
  
  .text-container{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 4px;
    max-width: 260px;

     .title {
        font-family: ${theme.secondaryFontFamily};
        font-weight: 500;
        font-style: normal;
        font-size: 14px;
        line-height: 120%;
        letter-spacing: 0.07em;
    }

    .description {
        font-weight: 300;
        font-size: 14px;
        line-height: 145%;
        letter-spacing: 0.07em;
    }
  }

  .icon {
    background: ${theme.iconWarningColor};
    height: 24px;
    width: 24px;
  }
`
);
