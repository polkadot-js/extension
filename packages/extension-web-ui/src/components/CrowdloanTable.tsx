// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _FundStatus } from '@subwallet/chain-list/types';
import { TokenBalance } from '@subwallet/extension-web-ui/components';
import CrowdloanItem from '@subwallet/extension-web-ui/components/Crowdloan/CrowdloanItem';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { _CrowdloanItemType, ThemeProps } from '@subwallet/extension-web-ui/types';
import { customFormatDate } from '@subwallet/extension-web-ui/utils';
import { getCrowdloanTagColor, getCrowdloanTagName } from '@subwallet/extension-web-ui/utils/crowdloan';
import { Logo, Table, Tag } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  items: _CrowdloanItemType[];
  hideBalance?: boolean
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, hideBalance, items } = props;
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);

  const columns = useMemo(() => {
    const getUnlockTexts = (fundStatus: _FundStatus, unlockTime: number): [string, string, string] => {
      if (fundStatus === _FundStatus.WON) {
        if (unlockTime < Date.now()) {
          return [t('Dissolved'), t('On'), '-won'];
        }

        return [t('Locked'), t('Until'), '-won'];
      }

      if (fundStatus === _FundStatus.IN_AUCTION) {
        return [t('Crowdloan'), t('Ends on'), '-in-auction'];
      }

      return [t('Refunded'), t('On'), '-fail'];
    };

    return [
      {
        title: t('Project name'),
        dataIndex: 'name',
        key: 'name',
        render: (_: any, row: _CrowdloanItemType) => {
          return <div className='__row-project-container'>
            <Logo
              className='__row-project-logo'
              isShowSubLogo={true}
              network={row.chainSlug}
              shape={'squircle'}
              size={40}
              subLogoShape={'circle'}
              subNetwork={row.relayChainSlug}
            />
            <div className='__row-project-information'>
              <div className={'__row-project-information-part-1'}>
                <div className={'__row-project-name'}>{row.chainName}</div>
              </div>

              <div className={'__row-project-parachain'}>{`${row.relayChainName} ${t('parachain')}`}</div>
            </div>
          </div>;
        }
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        className: '__table-status-col',
        render: (_: any, item: _CrowdloanItemType) => {
          return (
            <Tag color={getCrowdloanTagColor(item.fundStatus)}>
              {getCrowdloanTagName(item.fundStatus)}
            </Tag>
          );
        }
      },
      {
        title: t('Details'),
        dataIndex: 'details',
        key: 'details',
        render: (_: any, row: _CrowdloanItemType) => {
          const [text1, text2, statusClass] = getUnlockTexts(row.fundStatus, row.unlockTime);
          const unlockTime = customFormatDate(new Date(row.unlockTime), '#YYYY#-#MM#-#DD#');

          return <div className={'__row-fund-unlock-detail'}>
            <div className={'__row-fund-unlock-detail-line-1'}>{text1}</div>
            <div className={CN('__row-fund-unlock-detail-line-2', statusClass)}>{`${text2} ${unlockTime}`}</div>
          </div>;
        }
      },
      {
        title: t('Contribution'),
        dataIndex: 'contribution',
        key: 'contribution',
        render: (_: any, row: _CrowdloanItemType) => {
          return (
            <TokenBalance
              autoHideBalance={hideBalance}
              convertedValue={row.contribution.convertedValue}
              symbol={row.contribution.symbol}
              value={row.contribution.value}
            />
          );
        }
      }
    ];
  }, [hideBalance, t]);

  const getRowKey = useCallback((item: _CrowdloanItemType) => {
    return `${item.fundId}-${item.relayChainSlug}`;
  }, []);

  if (isWebUI) {
    return (
      <div className={CN(className)}>
        <Table
          columns={columns}
          dataSource={items}
          pagination={false}
          rowKey={getRowKey}
        />
      </div>
    );
  }

  return (
    <div className={CN(className)}>
      <div className={'__col-names-container'}>
        <div className='__col-name'>{t('Project name')}</div>
        <div className='__col-name'>{t('Contribution')}</div>
      </div>

      <div className={'__list-container'}>
        {
          items.map((item) => (
            <CrowdloanItem
              hideBalance={hideBalance}
              item={item}
              key={`${item.fundId}-${item.relayChainSlug}`}
            />
          ))
        }
      </div>
    </div>
  );
};

const CrowdloanTable = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    // table
    '.__row-project-container': {
      display: 'flex',
      gap: token.sizeXS
    },

    '.__row-project-information': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingRight: token.paddingXS
    },

    '.__row-project-information-part-1': {
      display: 'flex'
    },

    '.__row-project-name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.headingFontWeight,
      color: token.colorTextLight1,
      paddingRight: token.sizeXS,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.__row-project-parachain': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4
    },

    '.__row-fund-unlock-detail-line-1': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1
    },

    '.__row-fund-unlock-detail-line-2': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,

      '&.-won': {
        color: token.colorSuccess
      },

      '&.-in-auction': {
        color: token.gold
      },

      '&.-fail': {
        color: token.colorError
      }
    },

    'td.__table-status-col': {
      verticalAlign: 'top'
    },

    // list
    '.__col-names-container': {
      display: 'flex',
      justifyContent: 'space-between',
      paddingBottom: token.paddingXS
    },

    '.__col-name': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight4
    },

    '.__list-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS,
      paddingBottom: token.paddingXS
    }
  };
});

export default CrowdloanTable;
