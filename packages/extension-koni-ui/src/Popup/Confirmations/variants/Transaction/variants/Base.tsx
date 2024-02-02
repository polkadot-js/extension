// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import { CommonTransactionInfo, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { useGetNativeTokenBasicInfo, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

export interface BaseTransactionConfirmationProps extends ThemeProps {
  transaction: SWTransactionResult;
}

const Component: React.FC<BaseTransactionConfirmationProps> = (props: BaseTransactionConfirmationProps) => {
  const { className, transaction } = props;

  const { t } = useTranslation();

  const { decimals, symbol } = useGetNativeTokenBasicInfo(transaction.chain);

  return (
    <div className={CN(className)}>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
      <MetaInfo
        className={'meta-info'}
        hasBackgroundWrapper
      >
        <MetaInfo.Number
          decimals={decimals}
          label={t('Estimated fee')}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </div>
  );
};

const BaseTransactionConfirmation = styled(Component)<BaseTransactionConfirmationProps>(({ theme: { token } }: BaseTransactionConfirmationProps) => {
  return {};
});

export default BaseTransactionConfirmation;
