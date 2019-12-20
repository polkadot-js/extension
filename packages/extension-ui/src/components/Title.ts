// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import styled from 'styled-components';

export default styled.div`
  width: 100%;
  margin-bottom: 8px;
  margin-top: 18px;
  font-weight: 800;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }): string => theme.textColor};
  opacity: 0.65;
`;
