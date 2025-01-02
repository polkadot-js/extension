// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  banner?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Box ({ banner, children, className }: Props): React.ReactElement<Props> {
  return (
    <article className={className}>
      {children}
      {banner && <div className='banner'>{banner}</div>}
    </article>
  );
}

export default styled(Box)<Props>`
  background: var(--readonlyInputBackground);
  border: 1px solid var(--inputBorderColor);
  border-radius: var(--borderRadius);
  color: var(--subTextColor);
  font-family: var(--fontFamily);
  font-size: var(--fontSize);
  margin: 0.75rem 24px;
  padding: var(--boxPadding);
  position: relative;

  .banner {
    background: darkorange;
    border-radius: 0 var(--borderRadius) 0 var(--borderRadius);
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    position: absolute;
    right: 0;
    top: 0;
  }
`;
