// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  className?: string;
  label: string;
}

function Label ({ children, className, label }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default styled(Label)`
  color: ${({ theme }): string => theme.textColor};

  label {
    font-size: ${({ theme }): string => theme.labelFontSize};
    line-height: ${({ theme }): string => theme.labelLineHeight};
    margin-bottom: 12px;
  }
`;
