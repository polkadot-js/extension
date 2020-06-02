// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';

import Svg from './Svg';

interface Props {
  className?: string;
  icon?: string;
  onClick: MouseEventHandler<HTMLDivElement>;
  text: string;
}

function ActionText ({ className, icon, onClick, text }: Props): React.ReactElement<Props> {
  return (
    <div
      className={className}
      onClick={onClick}
    >
      {icon && <Svg src={icon} />}
      <span>{text}</span>
    </div>
  );
}

export default styled(ActionText)(({ theme }: ThemeProps) => `
  cursor: pointer;

  span {
    color: ${theme.labelColor}
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    text-decoration-line: underline;
  }

  ${Svg} {
    background: ${theme.iconNeutralColor};
    display: inline-block;
    height: 14px;
    margin-right: 6px;
    position: relative;
    top: 2px;
    width: 14px;
  }
`);
