// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';
import ReactIcon from '@polkadot/react-identicon';

import arrow from '../assets/arrowTopRight.svg';
import Svg from './Svg';

interface Props {
  className?: string;
  iconTheme?: 'beachball' | 'empty' | 'jdenticon' | 'polkadot' | 'substrate';
  isExternal?: boolean | null;
  onCopy?: () => void;
  prefix?: number;
  value?: string | null;
}

function Identicon ({ className, iconTheme, isExternal, onCopy, prefix, value }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <ReactIcon
        className='icon'
        onCopy={onCopy}
        prefix={prefix}
        size={64}
        theme={iconTheme}
        value={value}
      />
      {isExternal && (
        <div className='externalArrowWrapper'><Svg className='externalArrow'
          src={arrow}/></div>
      )}
    </div>
  );
}

export default styled(Identicon)(({ theme }: ThemeProps) => `
  background: rgba(192, 192, 292, 0.25);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  position: relative;

  .container:before {
    box-shadow: none;
    background: ${theme.identiconBackground};
  }

  .externalArrowWrapper{
    position: absolute;
    right: 0;
    height: 10px;
    width: 10px;
    background-color: ${theme.textColor};
    border-radius: 20%;

    .externalArrow {
      height: 8px;
      width: 8px;
      position: absolute;
      top: 1px;
      right: 1px;
      background-color: ${theme.background};
      visibility: visible;
    }
  }

  svg {
    circle:first-of-type {
      display: none;
    }
  }
`);
