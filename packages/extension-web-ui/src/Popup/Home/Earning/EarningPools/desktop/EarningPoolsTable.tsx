// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolInfo } from '@subwallet/extension-base/types';
import { EarningTypeTag, Table } from '@subwallet/extension-web-ui/components';
import { BN_TEN } from '@subwallet/extension-web-ui/constants';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Logo, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  items: YieldPoolInfo[];
  onClickRow: (row: YieldPoolInfo) => void;
  filterFunction: (item: YieldPoolInfo) => boolean;
  emptyListFunction: () => React.ReactNode;
  searchFunction: (item: YieldPoolInfo, searchText: string) => boolean;
  searchTerm: string;
}

const Component: React.FC<Props> = ({ className, emptyListFunction, filterFunction, items, onClickRow,
  searchFunction, searchTerm }: Props) => {
  const { t } = useTranslation();
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);

  const columns = useMemo(() => {
    const tokenCol = {
      title: 'Token name',
      key: 'token_name',
      className: '__table-token-col',
      render: (row: YieldPoolInfo) => {
        return (
          <div className={'__row-token-name-wrapper'}>
            <Logo
              network={row.metadata.logo || row.chain}
              size={48}
            />
            <div className={'token-item'}>
              <div className={'token-info'}>
                <span>{assetRegistry[row.metadata.inputAsset]?.symbol}</span>
                <span className={'__token-name'}>
                &nbsp;(<span>{row.metadata.shortName}</span>)
                </span>
              </div>
              <div className={'__description'}>{row.metadata.description}</div>
            </div>
          </div>
        );
      }
    };

    const stakingTypeCol = {
      title: t('Staking type'),
      key: 'staking_type',
      className: '__table-create-at-col',
      sortable: true,
      render: (row: YieldPoolInfo) => {
        return (
          <EarningTypeTag
            chain={row.chain}
            className={'__item-tag'}
            type={row.type}
          />
        );
      }
    };

    const totalValueStakedCol = {
      title: t('Total value staked'),
      key: 'total_value_staked',
      className: '__table-progress-col',
      render: (row: YieldPoolInfo) => {
        const total = ((): string => {
          const tvl = row.statistic?.tvl;
          const asset = assetRegistry[row.metadata.inputAsset];

          if (tvl && asset) {
            const priceId = asset.priceId;

            if (!priceId) {
              return '0';
            }

            const price = priceMap[priceId] || 0;

            return new BigN(tvl)
              .div(BN_TEN.pow(asset.decimals || 0))
              .multipliedBy(price)
              .toString();
          } else {
            return '';
          }
        })();

        return (
          <div className={'__row-progress-wrapper'}>
            {total
              ? (
                <Number
                  decimal={0}
                  prefix={'$'}
                  value={total}
                />
              )
              : (
                <span>
                  {t('TBD')}
                </span>
              )}
          </div>
        );
      }
    };

    const rewardsPerYearCol = {
      title: t('Rewards per year'),
      key: 'rewards_per_year',
      className: '__table-limit-col',
      sortable: true,
      render: (row: YieldPoolInfo) => {
        const totalApy = row.statistic?.totalApy;
        const totalApr = row.statistic?.totalApr;

        const apy = ((): number | undefined => {
          if (totalApy) {
            return totalApy;
          }

          if (totalApr) {
            const rs = calculateReward(totalApr);

            return rs.apy;
          }

          return undefined;
        })();

        return (
          <div className={'__row-reward-per-year'}>
            {!!apy && (
              <Number
                className='__row-reward-per-year-value'
                decimal={0}
                suffix={'%'}
                value={apy}
              />
            )}
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
              shape='circle'
              size='xs'
            >
              {'Stake'}
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
  }, [assetRegistry, priceMap, t]);

  const getRowKey = useCallback((item: YieldPoolInfo) => {
    return item.slug;
  }, []);

  const tableItems = useMemo(() => {
    return items.filter((i) => filterFunction(i) && searchFunction(i, searchTerm));
  }, [filterFunction, items, searchFunction, searchTerm]);

  return (
    <div className={CN(className, 'earning-pools-table-container')}>
      <Table
        className={'earning-pools-table'}
        columns={columns}
        emptyList={emptyListFunction()}
        getRowKey={getRowKey}
        items={tableItems}
        onClickRow={onClickRow}
      />
    </div>
  );
};

export const EarningPoolsTable = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
      alignItems: 'center'
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
