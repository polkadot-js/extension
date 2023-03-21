// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicStatus, ExtrinsicType, TransactionAdditionalInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainName } from '@subwallet/extension-base/services/chain-service/utils';
import { getTransactionLink } from '@subwallet/extension-base/services/transaction-service/utils';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { InfoItemBase } from '@subwallet/extension-koni-ui/components/MetaInfo/parts/types';
import { TransactionHistoryDisplayItem } from '@subwallet/extension-koni-ui/Popup/Home/History/index';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { customFormatDate } from '@subwallet/extension-koni-ui/util/customFormatDate';
import { Button, Icon, SwIconProps, SwModal } from '@subwallet/react-ui';
import { ArrowSquareUpRight, CheckCircle, ProhibitInset, Spinner, StopCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  data: TransactionHistoryDisplayItem
}

function isTypeTransfer (txType: ExtrinsicType) {
  return [
    ExtrinsicType.TRANSFER_BALANCE,
    ExtrinsicType.TRANSFER_TOKEN,
    ExtrinsicType.TRANSFER_XCM
  ].includes(txType);
}

function isTypeStaking (txType: ExtrinsicType) {
  return [
    ExtrinsicType.STAKING_JOIN_POOL,
    ExtrinsicType.STAKING_LEAVE_POOL,
    ExtrinsicType.STAKING_BOND,
    ExtrinsicType.STAKING_UNBOND,
    ExtrinsicType.STAKING_WITHDRAW,
    ExtrinsicType.STAKING_COMPOUNDING].includes(txType);
}

export type StatusType = {
  schema: InfoItemBase['valueColorSchema'],
  icon: SwIconProps['phosphorIcon'],
  name: string
};

export const HistoryDetailModalId = 'historyDetailModalId';

function Component ({ className = '', data, onCancel }: Props): React.ReactElement<Props> {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const chainInfo = chainInfoMap[data.chain];
  const { t } = useTranslation();
  const { title } = data.displayData;
  const { amount, fee } = data;

  const txTypeNameMap: Record<string, string> = {
    [ExtrinsicType.TRANSFER_BALANCE]: t('Transfer'),
    [ExtrinsicType.TRANSFER_TOKEN]: t('Transfer'),
    [ExtrinsicType.TRANSFER_XCM]: t('Transfer'),
    [ExtrinsicType.SEND_NFT]: t('NFT'),
    [ExtrinsicType.CROWDLOAN]: t('Crowdloan'),
    [ExtrinsicType.STAKING_JOIN_POOL]: t('Stake'),
    [ExtrinsicType.STAKING_LEAVE_POOL]: t('Unstake'),
    [ExtrinsicType.STAKING_BOND]: t('Bond'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unbond'),
    [ExtrinsicType.STAKING_CLAIM_REWARD]: t('Claim reward'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_COMPOUNDING]: t('Compounding'),
    [ExtrinsicType.EVM_EXECUTE]: t('EVM Execute')
  };

  const stakingTypeNameMap: Record<string, string> = {
    [ExtrinsicType.STAKING_JOIN_POOL]: t('Stake'),
    [ExtrinsicType.STAKING_LEAVE_POOL]: t('Unstake'),
    [ExtrinsicType.STAKING_BOND]: t('Bond'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unbond'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_COMPOUNDING]: t('Compounding')
  };

  const statusMap = useMemo<Record<string, StatusType>>(() => ({
    [ExtrinsicStatus.SUCCESS]: {
      schema: 'success',
      icon: CheckCircle,
      name: t('Completed')
    },
    [ExtrinsicStatus.FAIL]: {
      schema: 'danger',
      icon: ProhibitInset,
      name: t('Failed')
    },
    [ExtrinsicStatus.PROCESSING]: {
      schema: 'gold',
      icon: Spinner,
      name: t('Processing')
    },
    [ExtrinsicStatus.PENDING]: {
      schema: 'gold',
      icon: Spinner,
      name: t('Pending')
    },
    [ExtrinsicStatus.UNKNOWN]: {
      schema: 'danger',
      icon: StopCircle,
      name: t('Unknown')
    }
  }), [t]);

  const openBlockExplorer = useCallback(
    (link: string) => {
      return () => {
        window.open(link, '_blank');
      };
    },
    []
  );

  const modalFooter = useMemo<React.ReactNode>(() => {
    if (data.status === 'processing') {
      return (
        <Button
          block
          icon={
            <Icon
              phosphorIcon={XCircle}
              weight={'fill'}
            />
          }
          onClick={onCancel}
          schema={'error'}
        >
          {t('Cancel')}
        </Button>
      );
    }

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
  }, [chainInfo, data.extrinsicHash, data.status, onCancel, openBlockExplorer, t]);

  const transactionType = data.type;

  return (
    <SwModal
      className={className}
      footer={modalFooter}
      id={HistoryDetailModalId}
      onCancel={onCancel}
      title={title}
    >
      <div className={'__layout-container'}>
        <MetaInfo>
          <MetaInfo.DisplayType
            label={t('Transaction type')}
            typeName={txTypeNameMap[data.type]}
          />

          {(() => {
            if (isTypeTransfer(transactionType) && data.additionalInfo && transactionType === ExtrinsicType.TRANSFER_XCM) {
              const xcmInfo = data.additionalInfo as TransactionAdditionalInfo<ExtrinsicType.TRANSFER_XCM>;

              return (
                <MetaInfo.Transfer
                  destinationChain={{
                    slug: xcmInfo.destinationChain,
                    name: _getChainName(chainInfoMap[xcmInfo.destinationChain])
                  }}
                  originChain={{
                    slug: data.chain,
                    name: _getChainName(chainInfo)
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

                <MetaInfo.Transfer
                  recipientAddress={data.to}
                  recipientName={data.toName}
                  senderAddress={data.from}
                  senderName={data.fromName}
                />
              </>
            );
          })()}

          <MetaInfo.Status
            label={t('Transaction status')}
            statusIcon={statusMap[data.status].icon}
            statusName={statusMap[data.status].name}
            valueColorSchema={statusMap[data.status].schema}
          />

          <MetaInfo.Default
            label={t('Extrinsic Hash')}
          >
            {toShort(data.extrinsicHash, 8, 9)}
          </MetaInfo.Default>

          <MetaInfo.Default
            label={t('Transaction time')}
          >
            {customFormatDate(data.time, '#hh#:#mm# #AMPM# - #MMM# #DD#, #YYYY#')}
          </MetaInfo.Default>

          {data.additionalInfo && transactionType === ExtrinsicType.SEND_NFT && (
            <>
              <MetaInfo.Default
                label={t('Amount')}
              >
                {amount?.value || ''}
              </MetaInfo.Default>

              <MetaInfo.Default
                label={t('Collection Name')}
              >
                {(data.additionalInfo as TransactionAdditionalInfo<ExtrinsicType.SEND_NFT>).collectionName}
              </MetaInfo.Default>
            </>
          )}

          {isTypeStaking(transactionType) && (
            <>
              <MetaInfo.DisplayType
                label={t('Staking type')}
                typeName={stakingTypeNameMap[transactionType]}
              />

              <MetaInfo.Number
                decimals={amount?.decimals || undefined}
                label={t('Staking value')}
                suffix={amount?.symbol || undefined}
                value={amount?.value || '0'}
              />
            </>
          )}

          {transactionType === ExtrinsicType.STAKING_CLAIM_REWARD && (
            <MetaInfo.Number
              decimals={amount?.decimals || undefined}
              label={t('Amount')}
              suffix={amount?.symbol || undefined}
              value={amount?.value || '0'}
            />
          )}

          {transactionType === ExtrinsicType.CROWDLOAN && (
            <MetaInfo.Number
              decimals={amount?.decimals || undefined}
              label={t('Contribute balance')}
              suffix={amount?.symbol || undefined}
              value={amount?.value || '0'}
            />
          )}

          <MetaInfo.Number
            decimals={fee?.decimals || undefined}
            label={t('Network fee')}
            suffix={fee?.symbol || undefined}
            value={fee?.value || '0'}
          />

          {(() => {
            if (isTypeTransfer(transactionType) && data.additionalInfo && transactionType === ExtrinsicType.TRANSFER_XCM) {
              const xcmInfo = data.additionalInfo as TransactionAdditionalInfo<ExtrinsicType.TRANSFER_XCM>;

              return (
                <>
                  <MetaInfo.Number
                    decimals={fee?.decimals || undefined}
                    label={t('Origin Chain fee')}
                    suffix={fee?.symbol || undefined}
                    value={fee?.value || '0'}
                  />

                  <MetaInfo.Number
                    decimals={xcmInfo.fee?.decimals || undefined}
                    label={t('Destination fee')}
                    suffix={xcmInfo.fee?.symbol || undefined}
                    value={xcmInfo.fee?.value || '0'}
                  />
                </>
              );
            }

            return null;
          })()}
        </MetaInfo>
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
