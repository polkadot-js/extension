// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import styled from 'styled-components';
import Button from './Button';

export default styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }): string => theme.btnAreaBackground};
  padding: 12px 1rem;
  
  &&& {
    margin-left: 0;
    margin-right: 0;
  }
  
  ${Button}:not(:last-child) {
    margin-bottom: 1.5rem;
  }
`;
