// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '@subwallet/extension-base/types';
import Table from '@subwallet/extension-web-ui/components/Table/Table';
import { Number } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, Coin } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { Avatar, EmptyList, MetaInfo } from '../../../../../components';
import { ThemeProps } from '../../../../../types';

interface Props extends ThemeProps {
  items: YieldPoolInfo[];
}

// todo: i18n this

export const DEFAULT_ITEMS_PER_PAGE = 10;

const Component: React.FC<Props> = ({ className, items }: Props) => {
  const value = '5HGX5Adwn2Rdp6qXfyN1j9oph6ZEuJuUSteRgXuAKpm4MB87';
  const columns = useMemo(() => {
    const accountCol = {
      title: 'Account',
      key: 'account',
      className: '__table-token-col',
      render: (row: YieldPoolInfo) => {
        return (
          <div className={'__row-token-name-wrapper'}>
            <Avatar
              size={20}
              theme={value ? isEthereumAddress(value) ? 'ethereum' : 'polkadot' : undefined}
              value={value}
            />
            <div className={'account-item'}>
              <div className={'__account-name'}>HD Subwallet 01</div>
              <div className={'__account-address'}>{'Ad2049jh...56097c'}</div>
            </div>
          </div>
        );
      }
    };

    const earningStatusCol = {
      title: 'Earning status',
      key: 'earning_status',
      className: '__earning-status-col',
      sortable: true,
      render: (row: YieldPoolInfo) => {
        return (
          <MetaInfo>
            <MetaInfo.Status
              className={'earning-status-item'}
              statusIcon={CheckCircle}
              statusName={('Earning rewards')}
              valueColorSchema={'success'}
            />
          </MetaInfo>
        );
      }
    };

    const activeStakeCol = {
      title: 'Active stake',
      key: 'active-stake',
      className: '__table-active-stake-col',
      render: (row: YieldPoolInfo) => {
        return (
          <div className={'__row-active-stake-wrapper'}>
            <div className={'__active-stake'}>
              <Number
                className={'__row-progress-value'}
                decimal={2}
                suffix={'DOT'}
                value={2908}
              />
            </div>
            <div className={'__derivative-balance'}>
              <span>Derivative balance: </span>
              &nbsp;<Number
                className={'__row-progress-value'}
                decimal={2}
                decimalOpacity={0.4}
                suffix={'sDOT'}
                value={51465300000}
              />
            </div>
          </div>
        );
      }
    };

    const unStakedCol = {
      title: 'Unstaked',
      key: 'unstaked',
      className: '__table-unstake-col',
      sortable: true,
      render: (row: YieldPoolInfo) => {
        return (
          <Number
            className={'__row-unstaked-value'}
            decimal={0}
            suffix={'DOT'}
            value={2038}
          />
        );
      }
    };
    const totalStakeCol = {
      title: 'Total stake',
      key: 'total-stake',
      className: '__table-total-stake-col',
      sortable: true,
      render: (row: YieldPoolInfo) => {
        return (
          <Number
            className={'__row-total-Stake-value'}
            decimal={2}
            decimalOpacity={0.4}
            suffix={'DOT'}
            value={3108}
          />
        );
      }
    };

    return [
      accountCol,
      earningStatusCol,
      activeStakeCol,
      unStakedCol,
      totalStakeCol
    ];
  }, []);

  const getRowKey = useCallback((item: YieldPoolInfo) => {
    return item.slug;
  }, []);

  const emptyList = useMemo(() => {
    return (
      <EmptyList
        emptyMessage={'Tokens will appear here'}
        emptyTitle={'No token found'}
        phosphorIcon={Coin}
      />
    );
  }, []);

  return (
    <>
      <div className={CN(className, 'explore-Table-container')}>
        <div className={'table-account-info'}>Account info</div>
        <Table
          className={'explore-Table'}
          columns={columns}
          emptyList={emptyList}
          getRowKey={getRowKey}
          items={items}
        />
      </div>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AccountInfoDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__table-token-col.__table-token-col, .__earning-status-col.__earning-status-col': {
      flex: 1.2
    },
    '.__earning-status-col, .__table-active-stake-col, .__table-total-stake-col, .__table-unstake-col': {
      display: 'flex',
      justifyContent: 'flex-end'
    },

    ['.__earning-status-col, .__table-active-stake-col, ' +
    '.__table-total-stake-col, .__table-transactions-col, ' +
    '.__table-unstake-col, .__table-mint-col']: {
      textAlign: 'center'
    },

    ['th.__earning-status-col.__earning-status-col, ' +
    'th.__table-active-stake-col.__table-active-stake-col, ' +
    'th.__table-unstake-col.__table-unstake-col, ' +
    'th.__table-total-stake-col.__table-total-stake-col, ' +
    'th.__table-transactions-col.__table-transactions-col, ' +
    'th.__table-mint-col.__table-mint-col']: {
      textAlign: 'center'
    },

    '.__tr': {
      'white-space': 'nowrap',
      cursor: 'pointer'
    },

    '.table-account-info.table-account-info': {
      fontSize: token.fontSizeXL,
      lineHeight: token.lineHeightHeading3,
      paddingBottom: token.paddingMD,
      color: token.colorWhite
    },

    '.__td': {
      overflow: 'hidden'
    },

    '.ant-number': {
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    },

    '.ant-number .ant-typography': {
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      color: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.__row-token-name-wrapper': {
      display: 'flex',
      gap: token.sizeSM
    },

    '.__account-name': {
      display: 'flex',
      color: token.colorTextLight1,
      fontSize: token.fontSizeXL,
      lineHeight: token.lineHeightHeading4,
      'white-space': 'nowrap'
    },
    '.account-item': {
      display: 'flex',
      flexDirection: 'column'
    },
    '.__token-name': {
      color: token.colorTextTertiary,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    '.__account-address': {
      fontSize: token.fontSizeSM,
      color: token.colorTextLabel,
      lineHeight: token.lineHeightSM
    },

    '.__derivative-balance': {
      display: 'flex',
      alignItems: 'center',
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLabel
    },
    '.__earning-status-col .__td-inner': {
      alignItems: 'center'
    },
    '.__row-reward-per-year': {
      color: token.colorSuccess
    },
    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 70
    },

    '.__row-mint-button': {
      cursor: 'pointer',
      padding: token.paddingXXS,

      '.ant-tag': {
        marginRight: 0
      },

      '&.-disabled': {
        opacity: 0.4,
        cursor: 'not-allowed'
      }
    },
    '.__table-detail_action-col.__table-detail_action-col': {
      flexGrow: 0,
      minWidth: 140
    },
    '.__table-mint-col.__table-mint-col': {
      flexGrow: 0,
      minWidth: 100
    },
    '.__row-create-at-value': {
      color: token.colorTextLight4,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    },

    '.__row-progress-value, .__row-transactions-value, .__row-holders-value, .__row-limit-value': {
      color: token.colorWhite,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },

    '.__row-progress-bar': {
      backgroundColor: token.colorBgDefault
    },

    '.__row-active-stake-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: token.marginXXS,
      flexDirection: 'column',
      alignItems: 'flex-end'
    },

    '.__row-progress': {
      maxWidth: 200,
      marginLeft: 'auto',
      marginRight: 'auto'
    },

    '.__pagination-wrapper': {
      display: 'flex',
      justifyContent: 'flex-end',
      paddingTop: token.padding,
      paddingBottom: token.padding
    },

    '.empty-list': {
      marginTop: 0,
      marginBottom: 0
    },

    '.__tr-list, .__loading-area, .empty-list': {
      minHeight: 376
    },

    '@media(max-width: 1199px)': {
      '.__earning-status-col.__earning-status-col, .__table-unstake-col.__table-unstake-col': {
        display: 'none'
      }
    },

    '@media(max-width: 991px)': {
      '.__table-mint-col.__table-mint-col': {
        minWidth: 80
      }
    }
  };
});

export default AccountInfoDesktopPart;
