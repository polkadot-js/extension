// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, TransactionAdditionalInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getChainflipExplorerLink, getExplorerLink } from '@subwallet/extension-base/services/transaction-service/utils';
import { ChainflipSwapTxData, SwapProviderId, SwapTxData } from '@subwallet/extension-base/types/swap';
import { InfoItemBase } from '@subwallet/extension-web-ui/components';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { HISTORY_DETAIL_MODAL } from '@subwallet/extension-web-ui/constants';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-web-ui/types';
import { Button, Icon, SwIconProps } from '@subwallet/react-ui';
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

    const extrinsicType = data.type;
    const chainInfo = chainInfoMap[data.chain];
    let originChainInfo = chainInfo;

    if (extrinsicType === ExtrinsicType.TRANSFER_XCM && data.additionalInfo) {
      const additionalInfo = data.additionalInfo as TransactionAdditionalInfo[ExtrinsicType.TRANSFER_XCM];

      originChainInfo = chainInfoMap[additionalInfo.originalChain] || chainInfo;
    }

    let link = (data.extrinsicHash && data.extrinsicHash !== '') && getExplorerLink(originChainInfo, data.extrinsicHash, 'tx');

    if (extrinsicType === ExtrinsicType.SWAP) {
      const additionalInfo = data.additionalInfo as SwapTxData;

      if ([SwapProviderId.CHAIN_FLIP_TESTNET, SwapProviderId.CHAIN_FLIP_MAINNET].includes(additionalInfo.provider.id)) {
        link = getChainflipExplorerLink(additionalInfo as ChainflipSwapTxData, originChainInfo);
      }
    }

    return (
      <Button
        block
        disabled={!link}
        icon={
          <Icon
            phosphorIcon={ArrowSquareUpRight}
            weight={'fill'}
          />
        }
        onClick={openBlockExplorer(link || '')}
      >
        {t('View on explorer')}
      </Button>
    );
  }, [chainInfoMap, data, openBlockExplorer, t]);

  return (
    <BaseModal
      className={className}
      footer={modalFooter}
      id={HISTORY_DETAIL_MODAL}
      onCancel={onCancel}
      title={data?.displayData?.title || ''}
    >
      <div className={'__layout-container'}>
        {data && <HistoryDetailLayout data={data} />}
      </div>
    </BaseModal>
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
