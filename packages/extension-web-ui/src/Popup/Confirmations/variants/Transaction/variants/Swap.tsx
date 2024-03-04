// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapTxData } from '@subwallet/extension-base/types/swap';
import { CommonTransactionInfo } from '@subwallet/extension-web-ui/components';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;

  // @ts-ignore
  const data = transaction.data as SwapTxData;

  return (
    <div className={CN(className)}>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
    </div>
  );
};

const SwapTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default SwapTransactionConfirmation;
