// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { unicode } from '../components';

type Props = {
  className?: string,
  to?: string
};

function Back ({ className, to = '/' }: Props) {
  return (
    <div className={className}>
      <Link to={to}>{unicode.BACK} Back</Link>
    </div>
  );
}

export default styled(Back)`
  padding: 0.5rem;
`;
