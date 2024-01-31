// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {Button, Icon, Logo, Number} from '@subwallet/react-ui';
import CN from 'classnames';
import { Coin, PlusCircle } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { EmptyList } from '../../../components';
import EarningTypeTag from '../../../components/Earning/EarningTypeTag';
import {SuppliedTokenInfo, ThemeProps} from '../../../types';
import Table from './table/Table'

interface Props extends ThemeProps {
  items: SuppliedTokenInfo[];
  onClickRow?: (item: SuppliedTokenInfo) => void;
  onClickMint?: (item: SuppliedTokenInfo) => void;
  loading?: boolean;
  totalItems?: number;
}

// todo: i18n this

export const DEFAULT_ITEMS_PER_PAGE = 10;

const Component: React.FC<Props> = ({ className, items, loading, onClickMint, onClickRow, totalItems }: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const onClickMock = useCallback(() => {
    alert('dung nguyen');
  }, []);
  const _onClickMint = useCallback((item: SuppliedTokenInfo): React.MouseEventHandler<HTMLDivElement> => {
    return (e) => {
      e.stopPropagation();
      onClickMint?.(item);
    };
  }, [onClickMint]);

  const columns = useMemo(() => {
    const tokenCol = {
      title: 'Token name',
      key: 'token_name',
      className: '__table-token-col',
      render: (row: SuppliedTokenInfo) => {
        return (
          <div className={'__row-token-name-wrapper'}>
            <Logo
              network={'polkadot'}
              size={48}
            />
            <div className={'token-item'}>
            <div className={'token-info'}>
              <span>DOT</span>
              <span className={'__token-name'}>
                &nbsp;(<span>Polkadot</span>)
              </span>
            </div>
            <div className={'__description'}>Start staking with just 1 DOT</div>
            </div>
          </div>
        );
      }
    };

    const stakingTypeCol = {
      title: 'Staking type',
      key: 'staking_type',
      className: '__table-create-at-col',
      sortable: true,
      render: (row: SuppliedTokenInfo) => {
        return (
          <EarningTypeTag
            className={'__item-tag'}
            comingSoon={true}
          />
        );
      }
    };

    const totalValueStakedCol = {
      title: 'Total value staked',
      key: 'total_value_staked',
      className: '__table-progress-col',
      render: (row: SuppliedTokenInfo) => {
        return (
          <div className={'__row-progress-wrapper'}>
            <Number
              className={'__row-progress-value'}
              decimal={2}
              prefix={'$'}
              value={51465300000}
            />
          </div>
        );
      }
    };

    const rewardsPerYearCol = {
      title: 'Rewards per year',
      key: 'rewards_per_year',
      className: '__table-limit-col',
      sortable: true,
      render: (row: SuppliedTokenInfo) => {
        return (
          <div className={'__row-reward-per-year'}>
            <Number
              decimal={2}
              decimalColor={'#4cd9ac'}
              intColor={'#4cd9ac'}
              suffix={'%'}
              unitColor={'#4cd9ac'}
              value={2038}
            />
          </div>
        );
      }
    };
    const detailActionCol = {
      title: '',
      key: 'detail_action',
      className: '__table-detail_action-col',
      render: () => {
        return (
          <div>
            <Button
              icon={(
                <Icon
                  className={'earning-item-stake-btn'}
                  phosphorIcon={PlusCircle}
                  size='sm'
                  weight='fill'
                />
              )}
              onClick={onClickMock}
              shape='circle'
              size='xs'
            >
              {'Stake now'}
            </Button>
          </div>
        );
      }
    };

    return [
      tokenCol,
      stakingTypeCol,
      totalValueStakedCol,
      rewardsPerYearCol,
      detailActionCol
    ];
  }, [onClickMock]);

  const getRowKey = useCallback((item: SuppliedTokenInfo) => {
    return item.id;
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
    <div className={CN(className, 'explore-table-container')}>
      <Table
        className={'explore-table'}
        columns={columns}
        emptyList={emptyList}
        getRowKey={getRowKey}
        items={items}
        loading={loading}
        onClickRow={onClickRow}
      />
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EarningPoolItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__table-token-col.__table-token-col, .__table-create-at-col.__table-create-at-col': {
      flex: 1.2
    },

    ['.__table-create-at-col, .__table-progress-col, ' +
        '.__table-holder-col, .__table-transactions-col, ' +
        '.__table-limit-col, .__table-mint-col']: {
      textAlign: 'center'
    },

    ['th.__table-create-at-col.__table-create-at-col, ' +
        'th.__table-progress-col.__table-progress-col, ' +
        'th.__table-limit-col.__table-limit-col, ' +
        'th.__table-holder-col.__table-holder-col, ' +
        'th.__table-transactions-col.__table-transactions-col, ' +
        'th.__table-mint-col.__table-mint-col']: {
      textAlign: 'center'
    },

    '.__tr': {
      'white-space': 'nowrap',
      cursor: 'pointer'
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
    '.__table-create-at-col .__td-inner': {
    alignItems: 'center',
  },

    '.__row-token-name-wrapper': {
      display: 'flex',
      gap: token.sizeSM
    },

    '.token-info': {
      display: 'flex',
      color: token.colorTextLight1,
      fontSize: token.fontSizeXL,
      lineHeight: token.lineHeightHeading4,
      'white-space': 'nowrap'
    },
    '.token-item': {
      display: 'flex',
      flexDirection: 'column'
    },
    '.__token-name': {
      color: token.colorTextTertiary,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    '.__description': {
      fontSize: token.fontSizeSM,
      color: token.colorTextLabel,
      lineHeight: token.lineHeightSM
    },
    '.__row-reward-per-year': {
      color: token.colorSuccess
    },
    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 70,
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

    '.__row-progress-value-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: token.marginXXS
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
      '.__table-create-at-col.__table-create-at-col, .__table-limit-col.__table-limit-col': {
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

export default EarningPoolItem;
