// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestYieldStepSubmit, SubmitYieldStepData } from '@subwallet/extension-base/background/KoniTypes';
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

  const txParams = useMemo((): SubmitYieldStepData => {
    const txData = transaction.data as RequestYieldStepSubmit;

    return txData.data as SubmitYieldStepData;
  }, [transaction.data]);

  const tokenInfoMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);

  const { t } = useTranslation();

  const { inputTokenDecimals, inputTokenSymbol } = useMemo(() => {
    const inputTokenInfo = tokenInfoMap[txParams.inputTokenSlug];

    return {
      inputTokenSymbol: _getAssetSymbol(inputTokenInfo),
      inputTokenDecimals: _getAssetDecimals(inputTokenInfo)
    };
  }, [tokenInfoMap, txParams.inputTokenSlug]);

  const derivativeTokenBasicInfo = useMemo(() => {
    if (!txParams.derivativeTokenSlug) {
      return;
    }

    const derivativeTokenInfo = tokenInfoMap[txParams.derivativeTokenSlug];

    return {
      symbol: _getAssetSymbol(derivativeTokenInfo),
      decimals: _getAssetDecimals(derivativeTokenInfo)
    };
  }, [txParams.derivativeTokenSlug, tokenInfoMap]);

  const { feeTokenDecimals, feeTokenSymbol } = useMemo(() => {
    const feeTokenInfo = tokenInfoMap[txParams.feeTokenSlug];

    return {
      feeTokenSymbol: _getAssetSymbol(feeTokenInfo),
      feeTokenDecimals: _getAssetDecimals(feeTokenInfo)
    };
  }, [txParams.feeTokenSlug, tokenInfoMap]);

  const estimatedReceivables = useMemo(() => {
    return Math.floor(parseInt(txParams.amount) * txParams.exchangeRate);
  }, [txParams.amount, txParams.exchangeRate]);

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
          value={txParams.amount}
        />

        {
          derivativeTokenBasicInfo && <MetaInfo.Number
            decimals={derivativeTokenBasicInfo.decimals}
            label={t('Estimated receivables')}
            suffix={derivativeTokenBasicInfo.symbol}
            value={estimatedReceivables.toString()}
          />
        }

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
