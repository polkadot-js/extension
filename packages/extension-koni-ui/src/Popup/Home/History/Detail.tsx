// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicStatus, ExtrinsicType, TransactionAdditionalInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainName } from '@subwallet/extension-base/services/chain-service/utils';
import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { TransactionHistoryDisplayItem } from '@subwallet/extension-koni-ui/Popup/Home/History/index';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ChainInfo } from '@subwallet/extension-koni-ui/types/chain';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { formatAmount } from '@subwallet/extension-koni-ui/util/amount';
import { customFormatDate } from '@subwallet/extension-koni-ui/util/customFormatDate';
import { Button, Icon, Logo, SwIconProps } from '@subwallet/react-ui';
import SwModal from '@subwallet/react-ui/es/sw-modal';
import { ArrowSquareUpRight, CheckCircle, ProhibitInset, Spinner, StopCircle, XCircle } from 'phosphor-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps & {
  id: string,
  onCancel: () => void,
  data: TransactionHistoryDisplayItem
}

interface InfoItemBase<T = 'default' | 'status' | 'transfer' | 'chain' | 'display_type'> {
  type: T,
  key: string,
  label: string,
}

interface DefaultInfoItem extends InfoItemBase<'default'> {
  value: string
}

interface StatusInfoItem extends InfoItemBase<'status'> {
  status: string,
  statusIcon: SwIconProps['phosphorIcon'],
  statusName: string,
}

interface TransferInfoItem extends Omit<InfoItemBase<'transfer'>, 'label'> {
  senderAddress: string,
  senderName?: string,
  recipientAddress: string,
  recipientName?: string,
  originChain?: ChainInfo,
  destinationChain?: ChainInfo,
}

interface ChainInfoItem extends InfoItemBase<'chain'> {
  chain: string,
  chainName: string,
}

interface DisplayTypeInfoItem extends InfoItemBase<'display_type'> {
  typeName: string
}

type InfoItem = DefaultInfoItem
| StatusInfoItem
| TransferInfoItem
| ChainInfoItem
| DisplayTypeInfoItem;

function DefaultItem ({ label, value }: DefaultInfoItem): React.ReactElement<DefaultInfoItem> {
  return (
    <div className={'__row'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={'__value'}>
          {value}
        </div>
      </div>
    </div>
  );
}

const statusIconMap: Record<string, SwIconProps['phosphorIcon']> = {
  completed: CheckCircle,
  processing: Spinner,
  failed: ProhibitInset,
  cancelled: StopCircle
};

function StatusItem ({ label, status, statusIcon, statusName }: StatusInfoItem): React.ReactElement<StatusInfoItem> {
  return (
    <div className={'__row'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={`__status-item -${status}`}>
          <Icon
            className={'__status-icon'}
            phosphorIcon={statusIcon}
            size={'sm'}
            weight={'fill'}
          />
          <div className={'__status-name'}>
            {statusName}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferItem ({ destinationChain,
  originChain,
  recipientAddress,
  recipientName,
  senderAddress,
  senderName }: TransferInfoItem): React.ReactElement<TransferInfoItem> {
  const { t } = useTranslation();

  const genAccountBlock = (address: string, name?: string) => {
    return (
      <div className={'__account-item'}>
        <Avatar
          className={'__account-avatar'}
          size={24}
          theme={address ? isEthereumAddress(address) ? 'ethereum' : 'polkadot' : undefined}
          value={address}
        />
        <div className={'__account-name'}>
          {name || toShort(address)}
        </div>
      </div>
    );
  };

  const genChainBlock = (chain: ChainInfo) => {
    return (
      <div className={'__chain-item'}>
        <Logo
          className={'__chain-logo'}
          network={chain.slug}
          size={24}
        />

        <div className={'__chain-name'}>
          {chain.name}
        </div>
      </div>
    );
  };

  return (
    <div className={'__row'}>
      <div className={'__col'}>
        <div className={'__label'}>{t('Sender')}</div>

        {genAccountBlock(senderAddress, senderName)}
        {!!originChain && genChainBlock(originChain)}
      </div>
      <div className={'__col'}>
        <div className={'__label'}>{t('Recipient')}</div>

        {genAccountBlock(recipientAddress, recipientName)}
        {!!destinationChain && genChainBlock(destinationChain)}
      </div>
    </div>
  );
}

function ChainItem ({ chain, chainName, label }: ChainInfoItem): React.ReactElement<ChainInfoItem> {
  return (
    <div className={'__row'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={'__chain-item'}>
          <Logo
            className={'__chain-logo'}
            network={chain}
            size={24}
          />

          <div className={'__chain-name'}>
            {chainName}
          </div>
        </div>
      </div>
    </div>
  );
}

function DisplayTypeItem ({ label, typeName }: DisplayTypeInfoItem): React.ReactElement<DisplayTypeInfoItem> {
  return (
    <div className={'__row'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={'__tx-type'}>
          {typeName}
        </div>
      </div>
    </div>
  );
}

function Component ({ className = '', data, id, onCancel }: Props): React.ReactElement<Props> {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const { t } = useTranslation();
  const { title } = data.displayData;
  const { amount, fee } = data;

  const statusNameMap: Record<ExtrinsicStatus, string> = {
    [ExtrinsicStatus.SUCCESS]: t('Completed'),
    [ExtrinsicStatus.FAIL]: t('Failed'),
    [ExtrinsicStatus.PROCESSING]: t('Processing'),
    [ExtrinsicStatus.UNKNOWN]: t('Unknown')
  };

  const txTypeNameMap: Record<string, string> = {
    [ExtrinsicType.TRANSFER_BALANCE]: t('Transfer'),
    [ExtrinsicType.TRANSFER_TOKEN]: t('Transfer'),
    [ExtrinsicType.TRANSFER_XCM]: t('Transfer'),
    [ExtrinsicType.SEND_NFT]: t('NFT'),
    [ExtrinsicType.CROWDLOAN]: t('Crowdloan'),
    [ExtrinsicType.STAKING_STAKE]: t('Stake'),
    [ExtrinsicType.STAKING_UNSTAKE]: t('Unstake'),
    [ExtrinsicType.STAKING_BOND]: t('Bond'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unbond'),
    [ExtrinsicType.STAKING_CLAIM_REWARD]: t('Claim reward'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_COMPOUNDING]: t('Compounding'),
    [ExtrinsicType.EVM_EXECUTE]: t('EVM Execute')
  };

  const stakingTypeNameMap: Record<string, string> = {
    [ExtrinsicType.STAKING_STAKE]: t('Stake'),
    [ExtrinsicType.STAKING_UNSTAKE]: t('Unstake'),
    [ExtrinsicType.STAKING_BOND]: t('Bond'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unbond'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_COMPOUNDING]: t('Compounding')
  };

  const genInfoItemComponent = (item: InfoItem) => {
    if (item.type === 'status') {
      return (
        <StatusItem {...item} />
      );
    }

    if (item.type === 'transfer') {
      return (
        <TransferItem {...item} />
      );
    }

    if (item.type === 'chain') {
      return (
        <ChainItem {...item} />
      );
    }

    if (item.type === 'display_type') {
      return (
        <DisplayTypeItem {...item} />
      );
    }

    return (
      <DefaultItem {...item} />
    );
  };

  const genInfoItems = () => {
    const networkItem: ChainInfoItem = {
      type: 'chain',
      key: 'network',
      label: t('Network'),
      chain: data.chain,
      chainName: _getChainName(chainInfoMap[data.chain])
    };

    const extrinsicHashItem: DefaultInfoItem = {
      type: 'default',
      key: 'extrinsic_hash',
      label: t('Extrinsic Hash'),
      value: toShort(data.extrinsicHash, 8, 9)
    };

    const txTypeItem: DisplayTypeInfoItem = {
      type: 'display_type',
      key: 'transaction_type',
      label: t('Transaction type'),
      typeName: txTypeNameMap[data.type]
    };

    const timeItem: DefaultInfoItem = {
      type: 'default',
      key: 'time',
      label: t('Transaction time'),
      value: customFormatDate(data.time, '#hh#:#mm# #AMPM# - #MMM# #DD#, #YYYY#')
    };

    const statusItem: StatusInfoItem = {
      type: 'status',
      key: 'status',
      label: t('Transaction status'),
      status: data.status,
      statusIcon: statusIconMap[data.status],
      statusName: statusNameMap[data.status]
    };

    const transferItem: TransferInfoItem = {
      type: 'transfer',
      key: 'send_receive',
      senderAddress: data.from,
      senderName: data.fromName,
      recipientAddress: data.to,
      recipientName: data.toName
    };

    const networkFeeItem: DefaultInfoItem = {
      type: 'default',
      key: 'network_fee',
      label: t('Network fee'),
      value: formatAmount(fee)
    };

    const result: InfoItem[] = [
      txTypeItem
    ];

    const transactionType = data.type;

    if (transactionType === ExtrinsicType.TRANSFER_BALANCE || transactionType === ExtrinsicType.TRANSFER_TOKEN || transactionType === ExtrinsicType.TRANSFER_XCM) {
      if (data.additionalInfo && transactionType === ExtrinsicType.TRANSFER_XCM) {
        const xcmInfo = data.additionalInfo as TransactionAdditionalInfo<ExtrinsicType.TRANSFER_XCM>;

        transferItem.originChain = {
          slug: data.chain,
          name: _getChainName(chainInfoMap[data.chain])
        };

        transferItem.destinationChain = {
          slug: xcmInfo.destinationChain,
          name: _getChainName(chainInfoMap[xcmInfo.destinationChain])
        };

        result.push(transferItem);
      } else {
        result.push(networkItem, transferItem);
      }

      result.push(
        statusItem,
        extrinsicHashItem,
        timeItem,
        {
          type: 'default',
          key: 'amount',
          label: t('Amount'),
          value: formatAmount(amount)
        }
      );

      if (data.additionalInfo && transactionType === ExtrinsicType.TRANSFER_XCM) {
        const xcmInfo = data.additionalInfo as TransactionAdditionalInfo<ExtrinsicType.TRANSFER_XCM>;

        result.push(
          {
            type: 'default',
            key: 'origin_chain_fee',
            label: t('Origin Chain fee'),
            value: formatAmount(fee)
          },
          {
            type: 'default',
            key: 'destination_fee',
            label: t('Destination fee'),
            value: formatAmount(xcmInfo.fee)
          }
        );
      } else {
        result.push(networkFeeItem);
      }

      return result;
    }

    result.push(
      networkItem,
      transferItem,
      statusItem,
      extrinsicHashItem,
      timeItem
    );

    if (data.additionalInfo && transactionType === ExtrinsicType.SEND_NFT) {
      const nftInfo = data.additionalInfo as TransactionAdditionalInfo<ExtrinsicType.SEND_NFT>;

      result.push(
        {
          type: 'default',
          key: 'amount',
          label: t('Amount'),
          value: amount?.value || ''
        },
        {
          type: 'default',
          key: 'collection_name',
          label: t('Collection Name'),
          value: nftInfo.collectionName
        },
        networkFeeItem
      );

      return result;
    }

    const isStaking = [ExtrinsicType.STAKING_STAKE, ExtrinsicType.STAKING_UNSTAKE, ExtrinsicType.STAKING_BOND, ExtrinsicType.STAKING_UNBOND, ExtrinsicType.STAKING_WITHDRAW, ExtrinsicType.STAKING_COMPOUNDING].includes(transactionType);

    if (isStaking) {
      result.push(
        {
          type: 'display_type',
          key: 'staking_type',
          label: t('Staking type'),
          typeName: stakingTypeNameMap[transactionType]
        },
        {
          type: 'default',
          key: 'staking_value',
          label: t('Staking value'),
          value: formatAmount(amount)
        },
        networkFeeItem
      );

      return result;
    }

    if (transactionType === ExtrinsicType.STAKING_CLAIM_REWARD) {
      result.push(
        {
          type: 'default',
          key: 'amount',
          label: t('Amount'),
          value: formatAmount(amount)
        },
        networkFeeItem
      );

      return result;
    }

    result.push(
      {
        type: 'default',
        key: 'contribute_balance',
        label: t('Contribute balance'),
        value: formatAmount(amount)
      },
      networkFeeItem
    );

    return result;
  };

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

    return (
      <Button
        block
        icon={
          <Icon
            phosphorIcon={ArrowSquareUpRight}
            weight={'fill'}
          />
        }
      >
        {t('View on explorer')}
      </Button>
    );
  }, [data.status, onCancel, t]);

  return (
    <SwModal
      className={className}
      footer={modalFooter}
      id={id}
      onCancel={onCancel}
      title={title}
    >
      <div className={'__layout-container'}>
        {genInfoItems().map(genInfoItemComponent)}
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
    },

    '.__row': {
      display: 'flex'
    },

    '.__row + .__row': {
      marginTop: token.margin
    },

    '.__col': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',

      '> div + div': {
        marginTop: token.marginSM
      }
    },

    '.__col.-to-right': {
      flex: 1,
      alignItems: 'flex-end'
    },

    '.__label': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.headingFontWeight,
      color: token.colorTextLight2
    },

    '.__tx-type': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.headingFontWeight,
      color: token.colorSuccess
    },

    '.__chain-item, .__status-item, .__account-item': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__chain-item, .__account-item, .__value': {
      color: token.colorTextLight4
    },

    '.__chain-name, .__status-name, .__value, .__account-name': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.bodyFontWeight
    },

    '.__chain-name, .__account-name': {
      marginLeft: token.sizeXS
    },

    '.__status-item': {
      '&.-completed': {
        color: token.colorSuccess
      },

      '&.-processing': {
        color: token['gold-6']
      },

      '&.-failed, &.-cancelled': {
        color: token.colorError
      }
    },

    '.__status-name': {
      marginLeft: token.sizeXXS
    }
  });
});
