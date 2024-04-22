// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { MetaInfo } from '@subwallet/extension-web-ui/components';
import { HistoryStatusMap, TxTypeNameMap } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import SwapLayout from '@subwallet/extension-web-ui/Popup/Home/History/Detail/parts/SwapLayout';
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

  const { t } = useTranslation();

  const { language } = useSelector((state) => state.settings);

  if (data.type === ExtrinsicType.SWAP) {
    return (
      <SwapLayout data={data} />
    );
  }

  return (
    <MetaInfo className={CN(className)}>
      <MetaInfo.DisplayType
        label={t('Transaction type')}
        typeName={t(TxTypeNameMap[data.type])}
      />
      <HistoryDetailHeader data={data} />
      <MetaInfo.Status
        label={t('Transaction status')}
        statusIcon={HistoryStatusMap[data.status].icon}
        statusName={t(HistoryStatusMap[data.status].name)}
        valueColorSchema={HistoryStatusMap[data.status].schema}
      />
      <MetaInfo.Default label={t('Extrinsic hash')}>{(data.extrinsicHash || '').startsWith('0x') ? toShort(data.extrinsicHash, 8, 9) : '...'}</MetaInfo.Default>
      <MetaInfo.Default label={t('Transaction time')}>{formatHistoryDate(data.time, language, 'detail')}</MetaInfo.Default>
      <HistoryDetailAmount data={data} />

      {
        isAbleToShowFee(data) && (<HistoryDetailFee data={data} />)
      }
    </MetaInfo>
  );
};

const HistoryDetailLayout = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default HistoryDetailLayout;
