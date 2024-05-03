// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { AccountGroupItem, AccountItem, ChainItem, DataItem, DefaultItem, DisplayTypeItem, NumberItem, StatusItem, TotalItem, TransferItem } from './parts';

interface Props extends ThemeProps {
  children?: React.ReactNode;
  hasBackgroundWrapper?: boolean;
  labelColorScheme?: 'light' | 'gray';
  labelFontWeight?: 'regular' | 'semibold';
  valueColorScheme?: 'light' | 'gray';
  spaceSize?: 'xxs' | 'xs' | 'sm' | 'ms';
}

const Component: React.FC<Props> = ({ children, className = '',
  hasBackgroundWrapper = false,
  labelColorScheme = 'light',
  labelFontWeight = 'semibold',
  spaceSize = 'ms', valueColorScheme = 'gray' }: Props) => (
  <div
    className={CN(
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
      display: 'flex',
      overflow: 'hidden',
      gap: token.sizeSM
    },

    '.__row.-d-column': {
      flexDirection: 'column',
      gap: 0
    },

    '&.-space-size-xxs': {
      '--space-size': `${token.sizeXXS}px`
    },

    '&.-space-size-xs': {
      '--space-size': `${token.sizeXS}px`
    },

    '&.-space-size-sm': {
      '--space-size': `${token.sizeSM}px`
    },

    '&.-space-size-ms': {
      '--space-size': `${token.size}px`
    },

    '.__row + .__row, .__row.-d-column .__col + .__col': {
      marginTop: 'var(--space-size)'
    },
    '.__row.-type-chain .__chain-name, .__row.-type-display-type .__type-name, .__row.-type-status .__status-name': {
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    },

    '.__row.-type-default .__value': {
      wordBreak: 'break-word'
    },

    '.__row.-type-total': {
      paddingTop: 'var(--space-size)',
      borderTop: '2px solid',
      borderTopColor: token.colorBgDivider,

      '.__label, .__value': {
        fontSize: token.fontSizeLG,
        lineHeight: token.lineHeightLG
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
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',

      '> div + div': {
        marginTop: token.marginSM
      },
      '&.-inline': {
        whiteSpace: 'nowrap'
      }
    },

    '.__col.-to-right': {
      flex: 1,
      alignItems: 'flex-end'
    },
    '.__row.-type-transfer .__col': {
      flex: 1
    },

    '.__col.-v-align-top': {
      justifyContent: 'flex-start'
    },

    '.__label': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      textAlign: 'left'
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

    '.__value.-schema-warning': {
      color: token.colorWarning
    },

    '.__value.-schema-magenta': {
      color: token['magenta-6']
    },

    '.__value.-schema-cyan': {
      color: token['cyan-6']
    },

    '.__value.-schema-green': {
      color: token['green-6']
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
      alignItems: 'center',
      maxWidth: '100%'
    },

    '.__value.-clickable': {
      cursor: 'pointer',
      userSelect: 'none'
    },

    '.__value.-disabled': {
      cursor: 'not-allowed'
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

    '.__account-name': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  });
});

type CompoundedComponent = React.ForwardRefExoticComponent<Omit<Props, 'theme'>> & {
  Data: typeof DataItem,
  Status: typeof StatusItem,
  Account: typeof AccountItem,
  AccountGroup: typeof AccountGroupItem,
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
MetaInfo.AccountGroup = AccountGroupItem;
MetaInfo.Transfer = TransferItem;
MetaInfo.Chain = ChainItem;
MetaInfo.DisplayType = DisplayTypeItem;
MetaInfo.Number = NumberItem;
MetaInfo.Total = TotalItem;
MetaInfo.Default = DefaultItem;

export default MetaInfo;
