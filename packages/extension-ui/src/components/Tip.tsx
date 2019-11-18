// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled, { ThemedStyledProps } from 'styled-components';
import { Theme } from './themes';
import warningImage from '../assets/warning.svg';
import {Svg} from '.';

interface Color {
  background: string;
  border: string;
  color: string;
}

interface Props {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  type?: keyof Theme['box'];
  warning?: boolean;
  error?: boolean;
}

function getColor ({ type, theme }: ThemedStyledProps<Props, Theme>): Color {
  return theme.box[type || 'info'] || theme.box.info;
}

function Tip ({ children, className, header, warning }: Props): React.ReactElement<Props> {
  return (
    <article className={className}>
      {header && <h3>{header}</h3>}
      {warning && <Svg src={warningImage}/>}
      <div><TipText warning={!warning}>{children}</TipText></div>
    </article>
  );
}


const TipText = styled.p<{warning: boolean}>`
  font-size: ${({ theme }): string => theme.fontSize};
  line-height: ${({ theme }): string => theme.lineHeight};
  color: ${({ theme }): string => theme.color};
  margin: ${({ warning }): string => warning ? '0 0 0 24px' : '-20px 0 0 24px'};
`;

export default styled(Tip)`
  background: ${({ theme }): string => theme.background};
  border-left: 0.25rem solid ${(p): string => getColor(p).border};
  color: ${(p): string => getColor(p).color};
  padding: 1rem 1.5rem;

  h3 {
    color: ${({ theme }): string => theme.color};
    font-weight: normal;
  }

  ${Svg} {
  width: 16px;
  height: 14px;
  background: ${({ theme, type }): string => type !== 'warn' ? theme.btnBgDanger : theme.iconWarningColor }
  }
`;
