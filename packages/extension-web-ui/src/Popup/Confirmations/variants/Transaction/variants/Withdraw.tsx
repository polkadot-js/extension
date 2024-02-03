// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestYieldWithdrawal } from '@subwallet/extension-base/types';
import { PageWrapper } from '@subwallet/extension-web-ui/components';
import CommonTransactionInfo from '@subwallet/extension-web-ui/components/Confirmation/CommonTransactionInfo';
import MetaInfo from '@subwallet/extension-web-ui/components/MetaInfo/MetaInfo';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { useGetChainAssetInfo, useSelector } from '@subwallet/extension-web-ui/hooks';
import useGetNativeTokenBasicInfo from '@subwallet/extension-web-ui/hooks/common/useGetNativeTokenBasicInfo';
import CN from 'classnames';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { transaction } = props;
  const { t } = useTranslation();

  const data = transaction.data as RequestYieldWithdrawal;

  const { poolInfoMap } = useSelector((state) => state.earning);

  const poolInfo = useMemo(() => poolInfoMap[data.slug], [poolInfoMap, data.slug]);

  const inputAsset = useGetChainAssetInfo(poolInfo.metadata.inputAsset);

  const { decimals, symbol } = useGetNativeTokenBasicInfo(data.unstakingInfo.chain);

  const amountDecimals = inputAsset?.decimals || 0;
  const amountSymbol = inputAsset?.symbol || '';

  return (
    <>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
      <MetaInfo
        className={'meta-info'}
        hasBackgroundWrapper
      >
        <MetaInfo.Number
          decimals={amountDecimals}
          label={t('Amount')}
          suffix={amountSymbol}
          value={data.unstakingInfo.claimable}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Estimated fee')}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </>
  );
};

const Wrapper = (props: Props) => {
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(props.className)}
      hideLoading={true}
      resolve={dataContext.awaitStores(['earning'])}
    >
      <Component {...props} />
    </PageWrapper>
  );
};

const WithdrawTransactionConfirmation = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default WithdrawTransactionConfirmation;
