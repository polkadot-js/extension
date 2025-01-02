// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  icon: string;
  onClick?: () => void;
}

function Icon ({ className = '', icon, onClick }: Props): React.ReactElement<Props> {
  return (
    <div
      className={`${className} icon`}
      onClick={onClick}
    >
      {icon}
    </div>
  );
}

export default styled(Icon)<Props>(({ onClick }) => `
  background: white;
  border-radius: 50%;
  box-sizing: border-box;
  cursor: ${onClick ? 'pointer' : 'inherit'};
  text-align: center;
`);
