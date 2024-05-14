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
  const { currencyData } = useSelector((state: RootState) => state.price);
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);

  const columns = useMemo(() => {
    const tokenCol = {
      title: 'Token name',
      key: 'token_name',
      className: '__table-token-col',
      render: (row: YieldPoolInfo) => {
        return (
          <div className={'__row-token-info-wrapper'}>
            <Logo
              className={'__row-token-logo'}
              network={row.metadata.logo || row.chain}
              size={48}
            />
            <div className={'__row-token-meta'}>
              <div className={'__row-token-title'}>
                <span>{assetRegistry[row.metadata.inputAsset]?.symbol}</span>
                <span className={'__row-token-shortname'}>
                &nbsp;(<span>{row.metadata.shortName}</span>)
                </span>
              </div>
              <div className={'__row-token-description'}>{row.metadata.description}</div>
            </div>
          </div>
        );
      }
    };

    const stakingTypeCol = {
      title: t('Earning type'),
      key: 'staking_type',
      className: '__table-staking-type-col',
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
      className: '__table-total-value-stake-col',
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
          <div className={'__row-total-stake-wrapper'}>
            {total
              ? (
                <Number
                  className={'__row-total-stake-value'}
                  decimal={0}
                  prefix={(currencyData?.isPrefix && currencyData?.symbol) || ''}
                  value={total}
                />
              )
              : (
                <span className={'__tbd'}>
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
      className: '__table-rewards-col',
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
          <div className={'__row-reward-wrapper'}>
            {apy
              ? (
                <Number
                  className='__row-reward-per-year-value'
                  decimal={0}
                  suffix={'%'}
                  value={apy}
                />
              )
              : (
                <span className={'__tbd'}>
                  {t('TBD')}
                </span>
              )
            }
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
          <div className={'__row-stake-button-wrapper'}>
            <Button
              className={'__row-stake-button'}
              icon={(
                <Icon
                  phosphorIcon={PlusCircle}
                  size='sm'
                  weight='fill'
                />
              )}
              shape='circle'
              size='xs'
            >
              {'Stake to earn'}
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
  }, [assetRegistry, currencyData?.isPrefix, currencyData?.symbol, priceMap, t]);

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
    '.__table-token-col.__table-token-col': {
      flex: 1.2
    },

    '.__table-staking-type-col.__table-staking-type-col': {
      flex: 0.8
    },

    '.__table-staking-type-col': {
      display: 'flex',
      justifyContent: 'flex-start'
    },

    '.__table-total-value-stake-col, .__table-rewards-col': {
      display: 'flex',
      justifyContent: 'flex-end'
    },

    '.__tr': {
      'white-space': 'nowrap',
      cursor: 'pointer',
      paddingTop: token.padding,
      paddingBottom: token.padding
    },

    '.__row-total-stake-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite,

      '.ant-number-integer': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal, .ant-number-suffix': {
        color: `${token.colorWhite} !important`,
        fontSize: `${token.fontSizeLG}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeightLG
      }
    },

    '.__row-reward-per-year-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.fontWeightStrong,
      color: token.colorSuccess,

      '.ant-number-integer': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal, .ant-number-suffix': {
        color: `${token.colorSuccess} !important`,
        fontSize: `${token.fontSizeLG}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeightLG
      }
    },

    '.__td': {
      overflow: 'hidden'
    },

    '.__tbd': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG
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
    '.__table-staking-type-col .__td-inner': {
      alignItems: 'center'
    },

    '.__row-token-info-wrapper': {
      display: 'flex',
      gap: token.sizeSM
    },

    '.__row-token-title': {
      display: 'flex',
      color: token.colorTextLight1,
      fontSize: token.fontSizeXL,
      lineHeight: token.lineHeightHeading4,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontWeight: token.fontWeightStrong,
      marginBottom: token.marginXXS
    },
    '.__row-token-meta': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    '.__row-token-shortname': {
      color: token.colorTextTertiary,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    '.__row-token-description': {
      fontSize: token.fontSizeSM,
      color: token.colorTextLabel,
      lineHeight: token.lineHeightSM,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    '.__row-reward-wrapper': {
      color: token.colorSuccess
    },
    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 70
    },

    '.__table-detail_action-col.__table-detail_action-col': {
      flex: 1,
      minWidth: 140,
      display: 'flex',
      justifyContent: 'flex-end'
    },

    '.empty-list': {
      marginTop: 0,
      marginBottom: 0
    },

    '.__loading-area, .empty-list': {
      minHeight: 376
    },

    '.__tr-list': {
      gap: 8,
      display: 'flex',
      flexDirection: 'column'
    },

    '.earning-pools-table .__thead': {
      color: token.colorWhite,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeight
    },

    '.earning-pools-table .__tr': {
      flex: '0 1 auto'
    },

    '.__row-stake-button .anticon': {
      width: 20,
      height: 20
    },

    '@media(max-width: 1199px)': {
      '.__table-staking-type-col.__table-staking-type-col, .__table-rewards-col.__table-rewards-col': {
        display: 'none'
      }
    }
  };
});
