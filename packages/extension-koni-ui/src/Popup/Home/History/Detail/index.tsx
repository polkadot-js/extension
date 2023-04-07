// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getTransactionLink } from '@subwallet/extension-base/services/transaction-service/utils';
import { InfoItemBase } from '@subwallet/extension-koni-ui/components';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, SwIconProps, SwModal } from '@subwallet/react-ui';
import { ArrowSquareUpRight } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import HistoryDetailLayout from './parts/Layout';

type Props = ThemeProps & {
  onCancel: () => void,
  data: TransactionHistoryDisplayItem | null
}

export type StatusType = {
  schema: InfoItemBase['valueColorSchema'],
  icon: SwIconProps['phosphorIcon'],
  name: string
};

export const HistoryDetailModalId = 'historyDetailModalId';

function Component ({ className = '', data, onCancel }: Props): React.ReactElement<Props> {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const { t } = useTranslation();

  const openBlockExplorer = useCallback(
    (link: string) => {
      return () => {
        window.open(link, '_blank');
      };
    },
    []
  );

  const modalFooter = useMemo<React.ReactNode>(() => {
    if (!data) {
      return null;
    }

    const chainInfo = chainInfoMap[data.chain];
    const link = (data.extrinsicHash && data.extrinsicHash !== '') && getTransactionLink(chainInfo, data.extrinsicHash);

    if (link) {
      return (
        <Button
          block
          icon={
            <Icon
              phosphorIcon={ArrowSquareUpRight}
              weight={'fill'}
            />
          }
          onClick={openBlockExplorer(link)}
        >
          {t('View on explorer')}
        </Button>
      );
    }

    return null;
  }, [chainInfoMap, data, openBlockExplorer, t]);

  return (
    <SwModal
      className={className}
      footer={modalFooter}
      id={HistoryDetailModalId}
      onCancel={onCancel}
      title={data?.displayData?.title || ''}
    >
      <div className={'__layout-container'}>
        {data && <HistoryDetailLayout data={data} />}
      </div>
    </SwModal>
  );
}

export const HistoryDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-body': {
      marginBottom: 0
    },

    '.ant-sw-modal-footer': {
      border: 0
    }
  });
});
