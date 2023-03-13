// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestBondingSubmit } from '@subwallet/extension-base/background/KoniTypes';
import CommonTransactionInfo from '@subwallet/extension-koni-ui/components/Confirmation/CommonTransactionInfo';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
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
  const data = transaction.data as RequestBondingSubmit;

  const { t } = useTranslation();

  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const chainInfo = useMemo(() => {
    return chainInfoMap[transaction.chain];
  }, [chainInfoMap, transaction.chain]);

  return (
    <div className={CN(className)}>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
      <MetaInfo
        hasBackgroundWrapper={true}
      >
        <MetaInfo.Account
          address={data.validatorInfo.address}
          label={t('Validator')}
          name={data.validatorInfo.identity}
          networkPrefix={chainInfo.substrateInfo?.addressPrefix}
        />
        <MetaInfo.Number
          decimals={0}
          label={t('Amount')}
          suffix={chainInfo?.substrateInfo?.symbol}
          value={data.amount}
        />
        <MetaInfo.Number
          decimals={chainInfo?.substrateInfo?.decimals || 0}
          label={t('Estimated fee')}
          suffix={chainInfo?.substrateInfo?.symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </div>
  );
};

const StakeTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default StakeTransactionConfirmation;
