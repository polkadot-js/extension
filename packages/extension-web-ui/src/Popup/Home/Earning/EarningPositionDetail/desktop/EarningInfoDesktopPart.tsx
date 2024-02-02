// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Avatar, MetaInfo } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, MinusCircle, PlusCircle } from 'phosphor-react';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const onClaimReward = useCallback(() => {
    alert('Dung Nguyen');
  }, []);

  const value = '0xD8EeBEc6dBBb9d761b660aA386F64bE5E3340872';

  return (
    <div
      className={CN(className, 'earning-info-desktop')}
    >
      <div className={'__claim-reward-area'}>
        <div className={'earning-info-title'}>
          <div className={'__earning-status-title'}>{t('Earning status')}</div>
          <div className={'__earning-status-tag'}>
            <MetaInfo>
              <MetaInfo.Status
                className={'earning-status-item'}
                statusIcon={CheckCircle}
                statusName={('Earning rewards')}
                valueColorSchema={'success'}
              />
            </MetaInfo>
          </div>
        </div>
        <div className={'claim-reward-action'}>
          <div className={'__network-label'}>Network</div>
          <div className={'__network-item'}>
            <div className={'__logo-network'}>
              <Avatar
                size={20}
                theme={value ? isEthereumAddress(value) ? 'ethereum' : 'polkadot' : undefined}
                value={value}
              />
            </div>
            <div className={'__network-text'}>Polkadot</div>
          </div>
        </div>
        <div className='__block-divider' />
        <div className={'earning-status-action'}>
          <Button
            icon={
              <Icon
                className={'earning-item-stake-btn'}
                phosphorIcon={MinusCircle}
                size='sm'
                weight='fill'
              />
            }
            onClick={onClaimReward}
            size='xs'
            type={'ghost'}
          >
            {t('Unstaked')}
          </Button>
          <Button
            icon={
              <Icon
                className={'earning-item-stake-btn'}
                phosphorIcon={PlusCircle}
                size='sm'
                weight='fill'
              />
            }
            onClick={onClaimReward}
            size='xs'
            type={'ghost'}
          >
            {t('Stake more')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const EarningInfoDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary,
  minHeight: 54,
  width: 384,
  paddingTop: token.padding,
  paddingBottom: token.padding,
  paddingLeft: token.paddingLG,
  paddingRight: token.paddingLG,
  '&:hover': {
    backgroundColor: token.colorBgInput
  },

  '.__part-title': {
    paddingTop: token.padding,
    paddingLeft: token.padding,
    paddingRight: token.padding
  },
  '.earning-info-title': {
    display: 'flex',
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    color: token.colorWhite,
    width: '100%',
    justifyContent: 'space-between'
  },
  '.__block-divider': {
    height: 2,
    width: 336,
    backgroundColor: token.colorBgDivider,
    marginTop: token.marginSM
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)',
    marginTop: token.marginSM,
    marginBottom: token.marginSM,
    marginLeft: token.margin,
    marginRight: token.margin
  },

  '.__claim-reward-area': {
    display: 'flex',
    flexDirection: 'column',
    gap: token.sizeSM,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: token.paddingSM,
    paddingLeft: token.padding,
    paddingRight: token.padding
  },
  '.claim-reward-action': {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between'
  },
  '.__network-item': {
    display: 'flex'
  },

  '.__claim-reward-value': {
    fontSize: token.fontSizeHeading4,
    lineHeight: token.lineHeightHeading4,
    fontWeight: token.headingFontWeight,
    color: token.colorTextLight1,

    '.ant-number-integer': {
      color: 'inherit !important',
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.ant-number-decimal, .ant-number-suffix': {
      color: `${token.colorTextLight3} !important`,
      fontSize: `${token.fontSizeHeading5}px !important`,
      fontWeight: 'inherit !important',
      lineHeight: token.lineHeightHeading5
    }
  },

  '.__claim-reward-area + .__separator': {
    marginTop: 0
  },

  '.__separator + .__reward-history-panel': {
    marginTop: -13
  },

  '.__view-explorer-button': {
    marginTop: token.marginSM
  }
}));
