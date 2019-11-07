// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled, { ThemedStyledProps } from 'styled-components';
import { Theme } from './themes';
import warningImage from '../assets/warning.png';

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
}

function getColor ({ type, theme }: ThemedStyledProps<Props, Theme>): Color {
  return theme.box[type || 'info'] || theme.box.info;
}

function Tip ({ children, className, header, warning }: Props): React.ReactElement<Props> {
  return (
    <article className={className}>
      {header && <h3>{header}</h3>}
      {warning && <Image src={warningImage} alt="Warning"/>}
      <div><TipText warning={!warning}>{children}</TipText></div>
    </article>
  );
}

const Image = styled.img`
  width: 16px;
  height: 14px;
`;

const TipText = styled.p<{warning: boolean}>`
  font-size: 16px;
  line-height: 26px;
  font-weight: normal;
  color: #fff;
  margin: ${({ warning }): string => warning ? '0 0 0 24px' : '-28px 0 0 24px'};
`;

export default styled(Tip)`
  background: ${({ theme }): string => theme.background};
  border-left: 0.25rem solid ${(p): string => getColor(p).border};
  color: ${(p): string => getColor(p).color};
  margin: 0 -1rem;
  padding: 1rem 1.5rem;

  h3 {
    color: ${({ theme }): string => theme.color};
    font-weight: normal;
  }
`;
