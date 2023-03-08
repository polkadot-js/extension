// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Avatar } from '@subwallet/extension-koni-ui/components/Avatar';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { Icon, Logo, Number, SwIconProps } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

export interface InfoItemBase {
  label: string,
  valueColorSchema?: 'default' | 'light' | 'gray' | 'success' | 'gold' | 'danger'
}

type ChainInfo = {
  slug: string,
  name: string,
}

export interface DefaultInfoItem extends InfoItemBase {
  value: React.ReactNode,
  labelAlign?: 'top' | 'center',
}

export interface StatusInfoItem extends InfoItemBase {
  statusIcon: SwIconProps['phosphorIcon'],
  statusName: string,
}

export interface TransferInfoItem extends Omit<InfoItemBase, 'label'> {
  senderAddress: string,
  senderName?: string,
  recipientAddress: string,
  recipientName?: string,
  originChain?: ChainInfo,
  destinationChain?: ChainInfo,
}

export interface ChainInfoItem extends InfoItemBase {
  chain: string,
  chainName: string,
}

export interface DisplayTypeInfoItem extends Omit<InfoItemBase, 'valueColorSchema'> {
  typeName: string
}

export interface NumberInfoItem extends Omit<InfoItemBase, 'valueColorSchema'> {
  value: string | number | BigN,
  suffix?: string,
  decimals?: number,
  valueColorSchema?: InfoItemBase['valueColorSchema'] | 'even-odd'
}

export interface TotalInfoItem extends Omit<InfoItemBase, 'label' | 'valueColorSchema'> {
  value: string | number | BigN,
  suffix?: string,
  decimals?: number
}

export interface DataInfoItem extends InfoItemBase {
  value: string
}

export interface AccountInfoItem extends InfoItemBase {
  address: string;
  name?: string;
}

type Props = ThemeProps & {
  children?: React.ReactNode,
  hasBackgroundWrapper?: boolean,
  labelColorScheme?: 'light' | 'gray',
  labelFontWeight?: 'regular' | 'semibold',
  valueColorScheme?: 'light' | 'gray',
  spaceSize?: 'xs' | 'sm' | 'ms'
}

function DefaultItem ({ label, labelAlign, value, valueColorSchema = 'default' }: DefaultInfoItem): React.ReactElement<DefaultInfoItem> {
  return (
    <div className={'__row -type-default'}>
      <div className={CN('__col', {
        '-v-align-top': labelAlign === 'top',
        '-v-align-center': labelAlign === 'center'
      })}
      >
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={`__value -schema-${valueColorSchema}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function DataItem ({ label, value, valueColorSchema = 'default' }: DataInfoItem): React.ReactElement<DataInfoItem> {
  return (
    <div className={'__row -d-column -type-data'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={`__value mono-text -schema-${valueColorSchema}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusItem ({ label, statusIcon, statusName, valueColorSchema = 'default' }: StatusInfoItem): React.ReactElement<StatusInfoItem> {
  return (
    <div className={'__row -type-status'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={`__status-item __value -is-wrapper -schema-${valueColorSchema}`}>
          <Icon
            className={'__status-icon'}
            phosphorIcon={statusIcon}
            size={'sm'}
            weight={'fill'}
          />
          <div className={'__status-name ml-xxs'}>
            {statusName}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountItem ({ address, label, name, valueColorSchema = 'default' }: AccountInfoItem): React.ReactElement<AccountInfoItem> {
  return (
    <div className={'__row -type-account'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={`__account-item __value -is-wrapper -schema-${valueColorSchema}`}>
          <Avatar
            className={'__account-avatar'}
            size={24}
            theme={address ? isEthereumAddress(address) ? 'ethereum' : 'polkadot' : undefined}
            value={address}
          />
          <div className={'__account-name ml-xs'}>
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
  senderName,
  valueColorSchema = 'default' }: TransferInfoItem): React.ReactElement<TransferInfoItem> {
  const { t } = useTranslation();

  const genAccountBlock = (address: string, name?: string) => {
    return (
      <div className={`__account-item __value -schema-${valueColorSchema}`}>
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
      <div className={`__chain-item __value -is-wrapper -schema-${valueColorSchema}`}>
        <Logo
          className={'__chain-logo'}
          network={chain.slug}
          size={24}
        />

        <div className={'__chain-name ml-xs'}>
          {chain.name}
        </div>
      </div>
    );
  };

  return (
    <div className={'__row -type-transfer'}>
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

function ChainItem ({ chain, chainName, label, valueColorSchema = 'default' }: ChainInfoItem): React.ReactElement<ChainInfoItem> {
  return (
    <div className={'__row -type-chain'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={`__chain-item __value -is-wrapper -schema-${valueColorSchema}`}>
          <Logo
            className={'__chain-logo'}
            network={chain}
            size={24}
          />

          <div className={'__chain-name ml-xs'}>
            {chainName}
          </div>
        </div>
      </div>
    </div>
  );
}

function DisplayTypeItem ({ label, typeName }: DisplayTypeInfoItem): React.ReactElement<DisplayTypeInfoItem> {
  return (
    <div className={'__row -type-display-type'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <div className={'__type-name __value'}>
          {typeName}
        </div>
      </div>
    </div>
  );
}

function NumberItem ({ decimals = 0, label, suffix, value, valueColorSchema = 'default' }: NumberInfoItem): React.ReactElement<NumberInfoItem> {
  return (
    <div className={'__row -type-number'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <Number
          className={`__number-item __value -schema-${valueColorSchema}`}
          decimal={decimals}
          decimalOpacity={1}
          intOpacity={1}
          suffix={suffix}
          unitOpacity={1}
          value={value}
        />
      </div>
    </div>
  );
}

function TotalItem ({ decimals = 0, suffix, value }: TotalInfoItem): React.ReactElement<TotalInfoItem> {
  const { t } = useTranslation();

  return (
    <div className={'__row -type-total}'}>
      <div className={'__col'}>
        <div className={'__label'}>
          {t('Total')}
        </div>
      </div>
      <div className={'__col -to-right'}>
        <Number
          className={'__balance-item __value -schema-even-odd'}
          decimal={decimals}
          decimalOpacity={1}
          intOpacity={1}
          suffix={suffix}
          unitOpacity={1}
          value={value}
        />
      </div>
    </div>
  );
}

function Component ({ children, className = '',
  hasBackgroundWrapper = false,
  labelColorScheme = 'light',
  labelFontWeight = 'semibold',
  spaceSize = 'ms', valueColorScheme = 'gray' }: Props): React.ReactElement<Props> {
  return (
    <div className={CN(
      'meta-info-block',
      className,
      `-label-scheme-${labelColorScheme}`,
      `-label-font-weight-${labelFontWeight}`,
      `-value-scheme-${valueColorScheme}`,
      `-space-size-${spaceSize}`,
      {
        '-has-background-wrapper': hasBackgroundWrapper
      })}
    >
      {children}
    </div>
  );
}

const _MetaInfo = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '& + .meta-info-block': {
      marginTop: token.marginSM
    },

    '.ant-number .ant-typography': {
      fontSize: 'inherit !important',
      color: 'inherit !important',
      lineHeight: 'inherit'
    },

    '&.-has-background-wrapper': {
      background: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG,
      padding: token.paddingSM
    },

    '.ant-sw-modal-body': {
      marginBottom: 0
    },

    '.ant-sw-modal-footer': {
      border: 0
    },

    '.__row': {
      display: 'flex'
    },

    '.__row.-d-column': {
      flexDirection: 'column'
    },

    '&.-space-size-xs': {
      '.__row + .__row, .__row.-d-column .__col + .__col': {
        marginTop: token.marginXS
      },

      '.__row.-type-total': {
        paddingTop: token.paddingXS
      }
    },

    '&.-space-size-sm': {
      '.__row + .__row, .__row.-d-column .__col + .__col': {
        marginTop: token.marginSM
      },

      '.__row.-type-total': {
        paddingTop: token.paddingSM
      }
    },

    '&.-space-size-ms': {
      '.__row + .__row, .__row.-d-column .__col + .__col': {
        marginTop: token.margin
      },

      '.__row.-type-total': {
        paddingTop: token.padding
      }
    },

    '&.-label-font-weight-semibold': {
      fontWeight: token.headingFontWeight
    },

    '&.-label-scheme-light .__label, &.-value-scheme-light .__value': {
      color: token.colorTextLight2
    },

    '&.-label-scheme-gray .__label, &.-value-scheme-gray .__value': {
      color: token.colorTextLight4
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

    '.__col.-v-align-top': {
      justifyContent: 'flex-start'
    },

    '.__label': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },

    '.__value': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.bodyFontWeight
    },

    '.__value.-schema-light': {
      color: token.colorTextLight2
    },

    '.__value.-schema-gray': {
      color: token.colorTextLight4
    },

    '.__value.-schema-success': {
      color: token.colorSuccess
    },

    '.__value.-schema-gold': {
      color: token['gold-6']
    },

    '.__value.-schema-danger': {
      color: token.colorError
    },

    '.__value.-schema-even-odd': {
      color: token.colorTextLight2,

      '.ant-number-decimal': {
        color: `${token.colorTextLight4} !important`
      }
    },

    '.__value.__type-name': {
      fontWeight: token.headingFontWeight,
      color: token.colorSuccess
    },

    '.__value.-is-wrapper': {
      display: 'flex',
      alignItems: 'center'
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

    '.__row.-type-total': {
      borderTop: '2px solid',
      borderTopColor: token.colorBgDivider,

      '.__label, .__value': {
        fontSize: token.fontSizeLG,
        lineHeight: token.lineHeightLG
      }
    }
  });
});

type CompoundedComponent = React.ForwardRefExoticComponent<Omit<Props, 'theme'>> & {
  Data: typeof DataItem,
  Status: typeof StatusItem,
  Account: typeof AccountItem,
  Transfer: typeof TransferItem,
  Chain: typeof ChainItem,
  DisplayType: typeof DisplayTypeItem,
  Number: typeof NumberItem,
  Total: typeof TotalItem,
  Default: typeof DefaultItem,
};

const MetaInfo = _MetaInfo as unknown as CompoundedComponent;

MetaInfo.Data = DataItem;
MetaInfo.Status = StatusItem;
MetaInfo.Account = AccountItem;
MetaInfo.Transfer = TransferItem;
MetaInfo.Chain = ChainItem;
MetaInfo.DisplayType = DisplayTypeItem;
MetaInfo.Number = NumberItem;
MetaInfo.Total = TotalItem;
MetaInfo.Default = DefaultItem;

export default MetaInfo;
