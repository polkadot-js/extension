// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _FundStatus } from '@subwallet/chain-list/types';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { _CrowdloanItemType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { customFormatDate, getCrowdloanTagColor, getCrowdloanTagName } from '@subwallet/extension-koni-ui/utils';
import { Logo, Number, Tag } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  item: _CrowdloanItemType;
  hideBalance?: boolean;
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, hideBalance, item } = props;
  const { t } = useTranslation();

  const unlockTime = useMemo(() => {
    const date = customFormatDate(new Date(item.unlockTime), '#YYYY#-#MM#-#DD#');

    let label;

    if (item.fundStatus === _FundStatus.WON) {
      if (item.unlockTime < Date.now()) {
        label = t('Dissolved on');
      } else {
        label = t('Locked until');
      }
    } else if (item.fundStatus === _FundStatus.IN_AUCTION) {
      label = t('Crowdloan ends on');
    } else {
      label = t('Refunded on');
    }

    return `${label} ${date}`;
  }, [item.fundStatus, item.unlockTime, t]);

  return (
    <div className={CN(className)}>
      <Logo
        className={'__item-logo'}
        isShowSubLogo={true}
        network={item.chainSlug}
        shape={'squircle'}
        size={40}
        subLogoShape={'circle'}
        subNetwork={item.relayChainSlug}
      />

      <div className='__item-lines-container'>
        <div className='__item-line-1'>
          <div className='__item-name-wrapper'>
            <div className='__item-name'>{item.chainName}</div>
            <Tag color={getCrowdloanTagColor(item.fundStatus)}>
              {t(getCrowdloanTagName(item.fundStatus))}
            </Tag>
          </div>
          <div className='__item-value'>
            <Number
              decimal={0}
              hide={hideBalance}
              suffix={item.contribution.symbol}
              value={item.contribution.value}
            />
          </div>
        </div>
        <div className='__item-line-2'>
          <div className='__item-unlock-time'>
            {unlockTime}
          </div>
          <div className='__item-converted-value'>
            <Number
              decimal={0}
              hide={hideBalance}
              prefix={(item.contribution.currency?.isPrefix && item.contribution.currency.symbol) || ''}
              suffix={(!item.contribution.currency?.isPrefix && item.contribution.currency?.symbol) || ''}
              value={item.contribution.convertedValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CrowdloanItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    backgroundColor: token.colorBgSecondary,
    padding: token.paddingSM,
    borderRadius: token.borderRadiusLG,

    '.__item-logo': {
      marginRight: token.marginSM
    },

    '.__item-lines-container': {
      flex: 1,
      overflow: 'hidden',
      'white-space': 'nowrap'
    },

    '.__item-line-1, .__item-line-2': {
      display: 'flex',
      justifyContent: 'space-between',
      gap: token.size
    },

    '.__item-name, .__item-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight
    },

    '.__item-name, .__item-unlock-time': {
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.__item-unlock-time, .__item-converted-value': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.__item-value, .__item-converted-value': {
      '.ant-number, .ant-typography': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      }
    },

    '.__item-tag': {
      marginRight: 0
    },

    '.__item-name-wrapper': {
      display: 'flex',
      alignItems: 'center',
      gap: token.sizeXS,
      overflow: 'hidden'
    }
  };
});

export default CrowdloanItem;
