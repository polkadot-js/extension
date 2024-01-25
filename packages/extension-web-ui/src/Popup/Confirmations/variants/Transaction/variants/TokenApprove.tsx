// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenApproveData } from '@subwallet/extension-base/background/KoniTypes';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { CommonTransactionInfo, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useGetChainAssetInfo, useTranslation } from '@subwallet/extension-web-ui/hooks';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;

  const { t } = useTranslation();

  const txParams = useMemo((): TokenApproveData => transaction.data as TokenApproveData, [transaction.data]);

  const inputAsset = useGetChainAssetInfo(txParams.inputTokenSlug);
  const spenderAsset = useGetChainAssetInfo(txParams.spenderTokenSlug);

  return (
    <div className={CN(className)}>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
      <MetaInfo hasBackgroundWrapper>
        {
          inputAsset && (
            <MetaInfo.Account
              address={_getContractAddressOfToken(inputAsset)}
              label={t('Contract')}
            />
          )
        }

        {
          spenderAsset && (
            <MetaInfo.Account
              address={_getContractAddressOfToken(spenderAsset)}
              label={t('Spender contract')}
            />
          )
        }
        <MetaInfo.Number
          decimals={transaction.estimateFee?.decimals || 0}
          label={t('Estimated fee')}
          suffix={transaction.estimateFee?.symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </div>
  );
};

const TokenApproveConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default TokenApproveConfirmation;
