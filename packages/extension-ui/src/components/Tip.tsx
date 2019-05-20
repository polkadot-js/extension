// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import defaults from './defaults';

type Color = {
  background: string,
  border: string,
  color: string
};

type Type = keyof typeof defaults.box;

type Props = {
  children: React.ReactNode,
  className?: string,
  header?: React.ReactNode,
  type?: Type
};

function getColor ({ type }: Props): Color {
  return defaults.box[type || 'info'] || defaults.box.info;
}

function Tip ({ children, className, header }: Props) {
  return (
    <article className={className}>
      {header && <h3>{header}</h3>}
      <div>{children}</div>
    </article>
  );
}

export default styled(Tip)`
  background: ${(props) =>
    getColor(props).background
  };
  border-left: 0.25rem solid ${(props) =>
    getColor(props).border
  };
  color: ${(props) =>
    getColor(props).color
  };
  margin: ${defaults.boxMargin};
  padding: 1rem 1.25rem;

  h3 {
    color: ${(props) =>
      getColor(props).border
    };
    font-weight: normal;
  }
`;
