// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { TokenSpendingApprovalParams } from '@subwallet/extension-base/types';
import { CommonTransactionInfo, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useGetChainAssetInfo } from '@subwallet/extension-web-ui/hooks';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const { t } = useTranslation();

  const txParams = useMemo((): TokenSpendingApprovalParams => transaction.data as TokenSpendingApprovalParams, [transaction.data]);

  const inputAsset = useGetChainAssetInfo(txParams.contractAddress);
  const spenderAsset = useGetChainAssetInfo(txParams.spenderAddress);

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
        {
          !!inputAsset && (
            <MetaInfo.Account
              address={_getContractAddressOfToken(inputAsset)}
              label={t('Contract')}
            />
          )
        }

        {
          !!spenderAsset && (
            <MetaInfo.Account
              address={_getContractAddressOfToken(spenderAsset)}
              label={t('Spender contract')}
            />
          )
        }
      </MetaInfo>
    </div>
  );
};

const TokenApproveConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default TokenApproveConfirmation;
