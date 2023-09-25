// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestYieldStepSubmit } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import CommonTransactionInfo from '@subwallet/extension-koni-ui/components/Confirmation/CommonTransactionInfo';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo/MetaInfo';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const inputData = transaction.data as RequestYieldStepSubmit;
  const tokenInfoMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);

  console.log('inputData', inputData);

  const { t } = useTranslation();

  const { inputTokenDecimals, inputTokenSymbol } = useMemo(() => {
    const rewardTokenInfo = tokenInfoMap[inputData.data.rewardTokenSlug];

    return {
      inputTokenSymbol: _getAssetSymbol(rewardTokenInfo),
      inputTokenDecimals: _getAssetDecimals(rewardTokenInfo)
    };
  }, [inputData.data.rewardTokenSlug, tokenInfoMap]);

  const { rewardTokenDecimals, rewardTokenSymbol } = useMemo(() => {
    const rewardTokenInfo = tokenInfoMap[inputData.data.rewardTokenSlug];

    return {
      rewardTokenSymbol: _getAssetSymbol(rewardTokenInfo),
      rewardTokenDecimals: _getAssetDecimals(rewardTokenInfo)
    };
  }, [inputData.data.rewardTokenSlug, tokenInfoMap]);

  const { feeTokenDecimals, feeTokenSymbol } = useMemo(() => {
    const feeTokenInfo = tokenInfoMap[inputData.data.feeTokenSlug];

    return {
      feeTokenSymbol: _getAssetSymbol(feeTokenInfo),
      feeTokenDecimals: _getAssetDecimals(feeTokenInfo)
    };
  }, [inputData.data.feeTokenSlug, tokenInfoMap]);

  const estimatedReceivables = useMemo(() => {
    return Math.floor(parseInt(inputData.data.amount) * inputData.data.exchangeRate);
  }, [inputData.data.amount, inputData.data.exchangeRate]);

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
          decimals={inputTokenDecimals}
          label={t('Amount')}
          suffix={inputTokenSymbol}
          value={inputData.data.amount}
        />

        <MetaInfo.Number
          decimals={rewardTokenDecimals}
          label={t('Estimated receivables')}
          suffix={rewardTokenSymbol}
          value={estimatedReceivables.toString()}
        />

        <MetaInfo.Number
          decimals={feeTokenDecimals}
          label={t('Estimated fee')}
          suffix={feeTokenSymbol}
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
