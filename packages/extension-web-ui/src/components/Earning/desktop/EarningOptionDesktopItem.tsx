// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '@subwallet/extension-base/types';
import { EarningTypeTag } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, Logo, Number, Tooltip } from '@subwallet/react-ui';
import { PlusCircle } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  item?: YieldPoolInfo,
  compactMode?: boolean,
  onClickCalculatorBtn?: () => void;
  onClickInfoBtn?: () => void;
  onClickStakeBtn?: () => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const isAvailable = true;

  // const submitText = useMemo(() => {
  //   if (!isAvailable) {
  //     return t('Coming soon');
  //   }
  //
  //   switch (type) {
  //     case YieldPoolType.LENDING:
  //       return t('Supply now');
  //     case YieldPoolType.NOMINATION_POOL:
  //     case YieldPoolType.LIQUID_STAKING:
  //     default:
  //       return t('Stake now');
  //   }
  // }, [t, type, isAvailable]);
  //
  // const totalTitle = useMemo(() => {
  //   switch (type) {
  //     case YieldPoolType.LENDING:
  //       return t('Total value supplied');
  //     case YieldPoolType.NOMINATION_POOL:
  //     case YieldPoolType.LIQUID_STAKING:
  //     default:
  //       return t('Total value staked');
  //   }
  // }, [t, type]);

  const childClick = useCallback((onClick: VoidFunction) => {
    return (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      onClick();
    };
  }, []);

  const onClickMock = useCallback(() => {
    alert('onClickMOck');
  }, []);

  const exclusiveRewardTagNode = useMemo(() => {
    const label = t('No content');

    return (
      <Tooltip
        placement={'top'}
        title={label}
      >
        <div
          className={'exclusive-reward-tag-wrapper'}
          onClick={childClick(openInNewTab('https://docs.subwallet.app/main/web-dashboard-user-guide/earning/faqs#exclusive-rewards'))}
        >
          <EarningTypeTag
            chain={'polkadot'}
            className={'earning-item-tag'}
          />
        </div>
      </Tooltip>
    );
  }, [childClick, t]);

  return (
    <div
      className={className}
      onClick={onClickMock}
    >
      <div className={'earning-item-content-wrapper'}>
        <Logo
          network={'kusama'}
          size={64}
        />

        <div className={'earning-item-message-wrapper'}>
          <div className={'earning-item-name'}>{'Kusama'}</div>
          <div className={'earning-item-description'}>{'Stake any amount of ETH, get daily staking rewards and use your stETH across the DeFi ecosystem and L2.'}</div>
        </div>

        <div className='earning-item-tags-container'>
          {!isAvailable && (
            <EarningTypeTag
              chain={'kusama'}
              className={'__item-tag'}
              comingSoon={true}
            />
          )}
          <EarningTypeTag
            chain={'kusama'}
            className={'earning-item-tag'}
          />

          {exclusiveRewardTagNode}
        </div>

        <div className={'earning-item-reward'}>
          {
            !isAvailable
              ? <div className={'earning-item-not-available-title'}>TBD</div>
              : <Number
                decimal={0}
                size={30}
                suffix={'%'}
                value={'15.6'}
              />
          }

          <div className={'earning-item-reward-sub-text'}>{t('per year')}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: token.paddingXXS }}>
          <div className='earning-item-total-value-staked'>{'Total value staked'}:</div>

          {
            !isAvailable
              ? <div className='earning-item-not-available-info'>TBD</div>
              : <Number
                decimal={0}
                decimalColor={token.colorSuccess}
                intColor={token.colorSuccess}
                prefix={'$'}
                size={14}
                unitColor={token.colorSuccess}
                value={'100'}
              />
          }
        </div>

        <div className='earning-item-footer'>
          <Button
            disabled={!isAvailable}
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
      </div>
    </div>
  );
};

const EarningOptionDesktopItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    cursor: 'pointer',
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    padding: `${token.paddingXL}px ${token.paddingLG}px ${token.padding}px`,
    '&:hover': {
      backgroundColor: token.colorBgInput
    },

    '.earning-item-not-available-title': {
      fontSize: token.fontSizeHeading2,
      lineHeight: token.lineHeightHeading2,
      paddingBottom: 6
    },

    '.earning-item-not-available-info': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorSuccess
    },

    '.earning-item-name': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: 600,
      color: token.colorTextLight1,
      textAlign: 'center'
    },

    '.earning-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: 500,
      color: token.colorTextLight4,
      textAlign: 'center'
    },

    '.earning-item-reward': {
      display: 'flex',
      alignItems: 'flex-end',
      gap: token.paddingSM
    },

    '.earning-item-total-value-staked': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight4
    },

    '.earning-item-reward-sub-text': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight4,
      // backgroundColor: 'green',
      paddingBottom: 6
    },

    '.earning-item-content-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.padding,
      alignItems: 'center'
    },

    '.earning-item-message-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.paddingXXS
    },

    '.earning-item-icon-btn': {
      border: `2px solid ${token.colorBgBorder}`,
      borderRadius: '50%'
    },

    '.earning-item-footer': {
      display: 'flex',
      gap: token.padding,
      justifyContent: 'center',
      paddingTop: token.paddingLG,
      paddingBottom: token.padding
    },

    '.earning-item-stake-btn': {
      width: token.sizeMD,
      height: token.sizeMD
    },

    '.earning-item-tags-container': {
      display: 'flex',
      gap: token.sizeXS
    },

    '.earning-item-tag': {
      marginRight: 0
    },

    // compact mode style
    '&.-compact-mode': {
      paddingTop: token.sizeSM,
      paddingLeft: token.sizeSM,
      paddingRight: token.sizeSM,
      paddingBottom: 0,

      '.earning-item-not-available-title': {
        fontSize: token.fontSizeLG,
        lineHeight: token.lineHeightLG,
        paddingBottom: 0,
        fontWeight: token.headingFontWeight
      },

      '.earning-item-not-available-info': {
        color: token.colorSuccess,
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM
      }
    },

    '.__item-logo': {
      marginRight: token.marginSM
    },

    '.__item-lines-container': {
      flex: 1,
      overflow: 'hidden'
    },

    '.__item-line-1, .__item-line-2': {
      'white-space': 'nowrap',
      display: 'flex',
      justifyContent: 'space-between',
      gap: token.sizeSM
    },

    '.__item-line-1': {
      marginBottom: token.marginXXS
    },

    '.__item-rewards-label, .__item-total-staked-label': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.__item-name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.__item-rewards': {
      display: 'flex',
      alignItems: 'baseline',
      'white-space': 'nowrap',
      gap: token.sizeXXS
    },

    '.__item-rewards-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight
    },

    '.__item-total-staked-value': {
      color: token.colorSuccess,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.__item-rewards-value, .__item-total-staked-value': {
      '.ant-number, .ant-typography': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      }
    },

    '.__item-tags-container': {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      gap: token.sizeXS
    },

    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 70
    },

    '.__item-upper-part': {
      display: 'flex',
      paddingBottom: token.sizeXS
    },

    '.__item-lower-part': {
      borderTop: '2px solid rgba(33, 33, 33, 0.80)',
      display: 'flex',
      alignItems: 'center'
    }
  });
});

export default EarningOptionDesktopItem;
