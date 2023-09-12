// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestYieldStepSubmit, SubmitJoinNativeStaking, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import CommonTransactionInfo from '@subwallet/extension-koni-ui/components/Confirmation/CommonTransactionInfo';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo/MetaInfo';
import useGetNativeTokenBasicInfo from '@subwallet/extension-koni-ui/hooks/common/useGetNativeTokenBasicInfo';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const inputData = transaction.data as RequestYieldStepSubmit;
  const data = useMemo(() => {
    return inputData.data as SubmitJoinNativeStaking;
  }, [inputData.data]);

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
        <MetaInfo.AccountGroup
          accounts={data.selectedValidators}
          content={t('{{number}} selected validators', { replace: { number: data.selectedValidators.length } })}
          label={t(inputData.yieldPoolInfo.type === YieldPoolType.NOMINATION_POOL ? 'Pool' : 'Validators')}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Amount')}
          suffix={symbol}
          value={data.amount}
        />

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

const JoinYieldPoolConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default JoinYieldPoolConfirmation;
