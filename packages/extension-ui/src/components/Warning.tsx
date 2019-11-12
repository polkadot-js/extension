// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import WarningImageSrc from '../assets/warning.svg';

interface Props {
  children: React.ReactNode;
  danger?: boolean;
  className?: string;
}

const WarningImage = styled.span<Pick<Props, 'danger'>>`
  display: inline-block;
  width: 25px;
  height: 14px;
  margin: 5px 16px 5px 0;
  mask: url(${WarningImageSrc});
  mask-size: cover;
  background: ${({ danger, theme }): string => danger ? theme.iconDangerColor : theme.iconWarningColor};  
`;

function Warning ({ children, className, danger }: Props): React.ReactElement<Props> {
  return <div className={className}>
    <WarningImage danger={danger}/>
    <div>
      {children}
    </div>
  </div>;
}

export default styled(Warning)`
  display: flex;
  flex-direction: row;
  padding-left: ${({ danger }): string => danger ? '16px' : '0'};
  border-left: ${({ danger, theme }): string => danger ? `0.25rem solid ${theme.linkColorDanger}` : ''};
  
  > div {
    padding-right: 10px;
  }
`;
