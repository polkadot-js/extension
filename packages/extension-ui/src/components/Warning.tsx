// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import WarningImageSrc from '../assets/warning.svg';
import Svg from '@polkadot/extension-ui/components/Svg';

interface Props {
  children: React.ReactNode;
  danger?: boolean;
  className?: string;
}

function Warning ({ children, className, danger }: Props): React.ReactElement<Props> {
  return <div className={className}>
    <WarningImage danger={danger} src={WarningImageSrc}/>
    <div>
      {children}
    </div>
  </div>;
}

const WarningImage = styled(Svg)<Pick<Props, 'danger'>>`
  width: 25px;
  height: 14px;
  margin: 5px 16px 5px 0;
  background: ${({ danger, theme }): string => danger ? theme.iconDangerColor : theme.iconWarningColor};  
`;

export default styled(Warning)`
  display: flex;
  flex-direction: row;
  padding-left: ${({ danger }): string => danger ? '16px' : ''};
  border-left: ${({ danger, theme }): string => danger ? `0.25rem solid ${theme.linkColorDanger}` : ''};
  
  > div {
    padding-right: 10px;
  }
`;
