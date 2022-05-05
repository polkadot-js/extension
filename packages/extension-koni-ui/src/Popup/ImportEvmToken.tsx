// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function ImportEvmToken ({ className = '' }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      asdasda
    </div>
  );
}

export default React.memo(styled(ImportEvmToken)(({ theme }: Props) => `

`));
