// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import styled from 'styled-components';

interface Props {
  src: string;
}

export default styled.span<Props>`
    display: block;
    mask: ${({ src }): string => `url(${src})`};
    mask-size: cover;
    background: ${({ theme }): string => theme.color}; 
`;
