// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AlertBox, MetaInfo } from '@subwallet/extension-web-ui/components';
import { HistoryStatusMap, TxTypeNameMap } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import SwapTransactionBlock from '@subwallet/extension-web-ui/Popup/Home/History/Detail/parts/SwapTransactionBlock';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-web-ui/types';
import { formatHistoryDate, isAbleToShowFee, toShort } from '@subwallet/extension-web-ui/utils';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import HistoryDetailAmount from './Amount';
import HistoryDetailFee from './Fee';
import HistoryDetailHeader from './Header';

interface Props extends ThemeProps {
  data: TransactionHistoryDisplayItem;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, data } = props;

  const isSwap = ExtrinsicType.SWAP === data.type;

  const { t } = useTranslation();

  const { language } = useSelector((state) => state.settings);

  return (
    <MetaInfo className={CN(className)}>
      {isSwap && (
        <SwapTransactionBlock
          data={data}
        />
      )}
      {!isSwap && (
        <MetaInfo.DisplayType
          label={t('Transaction type')}
          typeName={t(TxTypeNameMap[data.type])}
        />
      )}
      <HistoryDetailHeader data={data} />
      {isSwap && (
        <MetaInfo.DisplayType
          label={t('Transaction type')}
          typeName={t(TxTypeNameMap[data.type])}
        />
      )}
      <MetaInfo.Status
        className={CN('__transaction-status', { '-is-swap': isSwap })}
        label={t('Transaction status')}
        statusIcon={HistoryStatusMap[data.status].icon}
        statusName={t(HistoryStatusMap[data.status].name)}
        valueColorSchema={HistoryStatusMap[data.status].schema}
      />
      {!isSwap && (
        <>
          <MetaInfo.Default
            label={t('Extrinsic hash')}
          >{(data.extrinsicHash || '').startsWith('0x') ? toShort(data.extrinsicHash, 8, 9) : '...'}</MetaInfo.Default>
          <MetaInfo.Default label={t('Transaction time')}>{formatHistoryDate(data.time, language, 'detail')}
          </MetaInfo.Default>
          <HistoryDetailAmount data={data} />
          {
            isAbleToShowFee(data) && (<HistoryDetailFee data={data} />)
          }
        </>
      )}
      {
        isSwap && (
          <>
            <MetaInfo.Number
              className={'__estimate-transaction-fee'}
              decimals={data.fee?.decimals}
              label={'Estimated transaction fee'}
              prefix={'$'}
              value={data.fee?.value || 0}
            />
            <AlertBox
              className={'__swap-quote-expired'}
              description={t('You can view detailed transaction progress on explorer')}
              title={t('Warning!')}
              type='warning'
            />
          </>
        )
      }

    </MetaInfo>
  );
};

const HistoryDetailLayout = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__estimate-transaction-fee': {
      marginBottom: 16
    },
    '.__estimate-transaction-fee.__row': {
      marginTop: 12
    },
    '.__swap-quote-expired': {
      marginBottom: -16
    },
    '.__transaction-status.-is-swap.__row': {
      marginTop: 12
    }

  };
});

export default HistoryDetailLayout;
