// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

interface Props {
  className?: string;
}

function VerticalSpace ({ className }: Props): React.ReactElement<Props> {
  return <div className={className}/>;
}

export default styled(VerticalSpace)`
  height: 100%;
`;
