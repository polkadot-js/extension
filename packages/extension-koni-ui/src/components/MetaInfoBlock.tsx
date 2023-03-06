// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { Icon, Logo, Number, SwIconProps } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps & {
  infoItems: InfoItem[]
}

interface InfoItemBase<T = 'default' | 'status' | 'transfer' | 'chain' | 'display_type' | 'balance' | 'account' | 'stakingStatus'> {
  type: T,
  key: string,
  label: string,
}

type ChainInfo = {
  slug: string,
  name: string,
}

export interface DefaultInfoItem extends InfoItemBase<'default'> {
  value: string
}

export interface StatusInfoItem extends InfoItemBase<'status'> {
  status: string,
  statusIcon: SwIconProps['phosphorIcon'],
  statusName: string,
}

export interface TransferInfoItem extends Omit<InfoItemBase<'transfer'>, 'label'> {
  senderAddress: string,
  senderName?: string,
  recipientAddress: string,
  recipientName?: string,
  originChain?: ChainInfo,
  destinationChain?: ChainInfo,
}

export interface ChainInfoItem extends InfoItemBase<'chain'> {
  chain: string,
  chainName: string,
}

export interface DisplayTypeInfoItem extends InfoItemBase<'display_type'> {
  typeName: string
}

export interface BalanceInfoItem extends InfoItemBase<'balance'> {
  balanceValue: string | number | BigN,
  suffix?: string
}

export interface AccountInfoItem extends InfoItemBase<'account'> {
  address: string;
  name?: string;
}

export interface StakingStatusInfoItem extends InfoItemBase<'stakingStatus'> {
  status: string;
  statusIcon: React.ReactNode;
}

export type InfoItem = DefaultInfoItem
| StatusInfoItem
| TransferInfoItem
| ChainInfoItem
| DisplayTypeInfoItem
| BalanceInfoItem
| AccountInfoItem
| StakingStatusInfoItem;

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

function AccountItem ({ address, label, name }: AccountInfoItem): React.ReactElement<AccountInfoItem> {
  return (
    <div className={'__row'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
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

function BalanceItem ({ balanceValue, label, suffix }: BalanceInfoItem): React.ReactElement<BalanceInfoItem> {
  return (
    <div className={'__row'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <Number
          className='__balance-item'
          decimal={0}
          decimalOpacity={0.45}
          intOpacity={0.45}
          size={14}
          suffix={suffix}
          unitOpacity={0.45}
          value={balanceValue}
        />
      </div>
    </div>
  );
}

function StakingStatusInfoItem ({ label, status, statusIcon }: StakingStatusInfoItem): React.ReactElement<StakingStatusInfoItem> {
  return (
    <div className={'__row'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={'__staking-status-item'}>
          {statusIcon}
          <div className={'__tx-type __status-name'}>
            {status}
          </div>
        </div>
      </div>
    </div>
  );
}

function Component ({ className = '', infoItems }: Props): React.ReactElement<Props> {
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

    if (item.type === 'balance') {
      return (
        <BalanceItem {...item} />
      );
    }

    if (item.type === 'account') {
      return (
        <AccountItem {...item} />
      );
    }

    if (item.type === 'stakingStatus') {
      return (
        <StakingStatusInfoItem {...item} />
      );
    }

    return (
      <DefaultItem {...item} />
    );
  };

  return (
    <div className={className}>
      {infoItems.map(genInfoItemComponent)}
    </div>
  );
}

export const MetaInfoBlock = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

    '.__chain-item, .__status-item, .__account-item, .__staking-status-item': {
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
