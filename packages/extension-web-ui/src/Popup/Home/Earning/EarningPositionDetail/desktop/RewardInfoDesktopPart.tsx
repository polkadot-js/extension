// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningRewardsHistoryModal } from '@subwallet/extension-web-ui/components/Modal/Earning/EarningRewardsHistoryModal';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, ModalContext, Number } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;
const modalId = 'earning-rewards-history-modal';

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const { activeModal } = useContext(ModalContext);
  const onClaimReward = useCallback(() => {
    alert('Dung Nguyen');
  }, []);

  const onOpenModal = useCallback(() => {
    activeModal(modalId);
  }, [activeModal]);

  return (
    <div
      className={CN(className, 'reward-info-desktop')}
    >
      <div className={'__claim-reward-area'}>
        <div className={'earning-info-title'}>Unclaimed rewards</div>
        <div className={'claim-reward-action'}>
          <Number
            className={'__claim-reward-value'}
            decimal={7}
            decimalOpacity={0.45}
            subFloatNumber={true}
            suffix={'DOT'}
            unitOpacity={0.45}
            value={10360002344}
          />
          <Button
            onClick={onClaimReward}
            size='xs'
          >
            {t('Claim rewards')}
          </Button>
        </div>
        <div className='__block-divider' />
        <Button
          block={true}
          className={'rewards-history'}
          onClick={onOpenModal}
          type={'ghost'}
        >Rewards history</Button>
        <EarningRewardsHistoryModal />
      </div>
    </div>
  );
}

export const RewardInfoDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
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
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    color: token.colorWhite,
    width: '100%'
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
