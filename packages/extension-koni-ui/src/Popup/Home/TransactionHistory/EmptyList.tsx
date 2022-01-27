// [object Object]
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function TransactionHistoryEmptyList ({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      Empty list
    </div>
  );
}

export default styled(TransactionHistoryEmptyList)(({ theme }: Props) => '');
