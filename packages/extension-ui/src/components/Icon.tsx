// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

type Props = {
  className?: string,
  icon: string
};

function Icon ({ className, icon }: Props) {
  return (
    <div className={`${className} icon`}>{icon}</div>
  );
}

export default styled(Icon)`
  background: white;
  border-radius: 50%;
  box-sizing: border-box;
  display: inline-block;
  height: inherit;
  text-align: center;
  width: inherit;
`;
