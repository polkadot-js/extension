// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

interface Props {
  className?: string;
  icon: string;
  onClick?: () => void | Promise<void>;
}

function Icon ({ className = '', icon, onClick }: Props): React.ReactElement<Props> {
  return (
    <div
      className={`${className} icon`}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClick={onClick}
    >
      {icon}
    </div>
  );
}

export default styled(Icon)(({ onClick }: Props) => `
  background: white;
  border-radius: 50%;
  box-sizing: border-box;
  cursor: ${onClick ? 'pointer' : 'inherit'};
  text-align: center;
`);
