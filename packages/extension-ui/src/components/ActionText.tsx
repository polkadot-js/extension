// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { MouseEventHandler } from 'react';
import type { ThemeProps } from '../types.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  icon?: IconDefinition;
  onClick: MouseEventHandler<HTMLDivElement>;
  text: string;
}

function ActionText ({ className, icon, onClick, text }: Props): React.ReactElement<Props> {
  return (
    <div
      className={className}
      onClick={onClick}
    >
      {icon && <FontAwesomeIcon icon={icon} />}
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

  .svg-inline--fa {
    color: ${theme.iconNeutralColor};
    display: inline-block;
    margin-right: 0.3rem;
    position: relative;
    top: 2px;
  }
`);
