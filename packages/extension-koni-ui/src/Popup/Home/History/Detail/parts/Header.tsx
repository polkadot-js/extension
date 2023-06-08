// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, TransactionAdditionalInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainName } from '@subwallet/extension-base/services/chain-service/utils';
import { MetaInfo } from '@subwallet/extension-koni-ui/components';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-koni-ui/types';
import { isTypeStaking, isTypeTransfer } from '@subwallet/extension-koni-ui/utils';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  data: TransactionHistoryDisplayItem;
}

const Component: React.FC<Props> = (props: Props) => {
  const { data } = props;

  const { t } = useTranslation();
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const isStaking = isTypeStaking(data.type);

  const xcmInfo = useMemo((): TransactionAdditionalInfo<ExtrinsicType.TRANSFER_XCM> | undefined => {
    if (isTypeTransfer(data.type) && data.additionalInfo && data.type === ExtrinsicType.TRANSFER_XCM) {
      return data.additionalInfo as TransactionAdditionalInfo<ExtrinsicType.TRANSFER_XCM>;
    }

    return undefined;
  }, [data.additionalInfo, data.type]);

  if (xcmInfo) {
    return (
      <MetaInfo.Transfer
        destinationChain={{
          slug: xcmInfo.destinationChain,
          name: _getChainName(chainInfoMap[xcmInfo.destinationChain])
        }}
        originChain={{
          slug: xcmInfo.originalChain || data.chain,
          name: _getChainName(chainInfoMap[xcmInfo.originalChain || data.chain])
        }}
        recipientAddress={data.to}
        recipientName={data.toName}
        senderAddress={data.from}
        senderName={data.fromName}
      />
    );
  }

  return (
    <>
      <MetaInfo.Chain
        chain={data.chain}
        label={t('Network')}
      />

      {
        isStaking
          ? (
            <MetaInfo.Account
              address={data.from}
              label={t('From account')}
              name={data.fromName}
              networkPrefix={chainInfoMap[data.chain]?.substrateInfo?.addressPrefix}
            />
          )
          : (
            <MetaInfo.Transfer
              recipientAddress={data.to}
              recipientName={data.toName}
              senderAddress={data.from}
              senderName={data.fromName}
            />
          )
      }
    </>
  );
};

const HistoryDetailHeader = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default HistoryDetailHeader;
