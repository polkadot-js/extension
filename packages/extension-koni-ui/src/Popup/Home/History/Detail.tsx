// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { HistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainName } from '@subwallet/extension-base/services/chain-service/utils';
import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
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
  data: HistoryItem
}

interface InfoItemBase<T = 'default' | 'status' | 'transfer' | 'chain' | 'display_type'> {
  type: T,
  key: string,
  label: string,
}

type ChainInfo = {
  slug: string,
  name: string,
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

function getBalanceText (balance: string, symbol: string): string {
  return `${balance} ${symbol}`;
}

function Component ({ className = '', data, id, onCancel }: Props): React.ReactElement<Props> {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const { t } = useTranslation();

  const statusNameMap: Record<string, string> = {
    completed: t('Completed'),
    processing: t('Processing'),
    failed: t('Failed'),
    cancelled: t('Cancelled')
  };

  const txTypeNameMap: Record<string, string> = {
    transfer: t('Transfer'),
    nft: t('NFT'),
    staking: t('Staking'),
    claim_reward: t('Claim reward'),
    crowdloan: t('Crowdloan')
  };

  const stakingTypeNameMap: Record<string, string> = {
    stake: t('Stake'),
    unstake: t('Unstake'),
    withdraw: t('Withdraw'),
    compounding: t('Compounding')
  };

  const modalTitle = useMemo<string>(() => {
    if (data.type === 'transfer') {
      if (data.isReceived) {
        return t('Send transaction');
      }

      return t('Receive transaction');
    }

    if (data.type === 'nft') {
      return t('NFT transaction');
    }

    if (data.type === 'staking') {
      if (data.stakingType === 'stake') {
        return t('Stake transaction');
      }

      if (data.stakingType === 'unstake') {
        return t('Unstake transaction');
      }

      if (data.stakingType === 'withdraw') {
        return t('Withdraw transaction');
      }

      return t('Compounding transaction');
    }

    if (data.type === 'claim_reward') {
      return t('Claim reward transaction');
    }

    return t('Crowdloan transaction');
  }, [t, data]);

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
      senderAddress: data.senderAddress,
      senderName: data.senderName,
      recipientAddress: data.recipientAddress,
      recipientName: data.recipientName
    };

    const networkFeeItem: DefaultInfoItem = {
      type: 'default',
      key: 'network_fee',
      label: t('Network fee'),
      value: getBalanceText(data.chainFee, data.symbol)
    };

    const result: InfoItem[] = [
      txTypeItem
    ];

    if (data.type === 'transfer') {
      if (data.destinationChainInfo) {
        transferItem.originChain = {
          slug: data.chain,
          name: _getChainName(chainInfoMap[data.chain])
        };

        transferItem.destinationChain = {
          slug: data.destinationChainInfo.slug,
          name: _getChainName(chainInfoMap[data.destinationChainInfo.slug])
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
          value: getBalanceText(data.amount, data.symbol)
        }
      );

      if (data.destinationChainInfo) {
        result.push(
          {
            type: 'default',
            key: 'origin_chain_fee',
            label: t('Origin Chain fee'),
            value: getBalanceText(data.chainFee, data.symbol)
          },
          {
            type: 'default',
            key: 'destination_fee',
            label: t('Destination fee'),
            value: getBalanceText(data.destinationChainInfo.fee, data.destinationChainInfo.symbol)
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

    if (data.type === 'nft') {
      result.push(
        {
          type: 'default',
          key: 'amount',
          label: t('Amount'),
          value: data.amount
        },
        {
          type: 'default',
          key: 'collection_name',
          label: t('Collection Name'),
          value: data.collectionName
        },
        networkFeeItem
      );

      return result;
    }

    if (data.type === 'staking') {
      result.push(
        {
          type: 'display_type',
          key: 'staking_type',
          label: t('Staking type'),
          typeName: stakingTypeNameMap[data.stakingType]
        },
        {
          type: 'default',
          key: 'staking_value',
          label: t('Staking value'),
          value: getBalanceText(data.amount, data.symbol)
        },
        networkFeeItem
      );

      return result;
    }

    if (data.type === 'claim_reward') {
      result.push(
        {
          type: 'default',
          key: 'amount',
          label: t('Amount'),
          value: getBalanceText(data.amount, data.symbol)
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
        value: getBalanceText(data.amount, data.symbol)
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
      title={modalTitle}
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
