// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import { BN_TEN } from '@subwallet/extension-koni-ui/constants';
import { EXCLUSIVE_REWARD_SLUGS, ExclusiveRewardContentMap } from '@subwallet/extension-koni-ui/constants/earning';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Logo, Number, Tooltip, Web3Block } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { PlusCircle, PlusMinus, Question } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import EarningTypeTag from './EarningTypeTag';

interface Props extends ThemeProps {
  item: YieldPoolInfo,
  compactMode?: boolean,
  onClickCalculatorBtn: () => void;
  onClickInfoBtn: () => void;
  onClickStakeBtn: () => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, compactMode, item, onClickCalculatorBtn, onClickInfoBtn, onClickStakeBtn } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { chain, description, inputAssets, logo, name, stats, type } = item;
  const { assetRegistry } = useSelector((state) => state.assetRegistry);
  const { priceMap } = useSelector((state) => state.price);
  const isAvailable = stats?.isAvailable ?? true;

  const tokenSlug = useMemo(() => inputAssets[0] || '', [inputAssets]);

  const decimals = useMemo(() => {
    return assetRegistry[tokenSlug]?.decimals || 0;
  }, [assetRegistry, tokenSlug]);

  const price = useMemo(() => {
    const priceId = assetRegistry[tokenSlug]?.priceId || '';

    return priceMap[priceId] || 0;
  }, [assetRegistry, priceMap, tokenSlug]);

  const tvl = useMemo(() => new BigN(stats?.tvl || 0).div(BN_TEN.pow(decimals)).multipliedBy(price).toString(), [decimals, price, stats?.tvl]);

  const totalApy = useMemo(() => {
    const apy = stats?.totalApy ?? calculateReward(stats?.totalApr || 0, 100, YieldCompoundingPeriod.YEARLY).apy;

    return apy || 0;
  }, [stats?.totalApr, stats?.totalApy]);

  const submitText = useMemo(() => {
    if (!isAvailable) {
      return t('Coming soon');
    }

    switch (type) {
      case YieldPoolType.LENDING:
        return t('Supply now');
      case YieldPoolType.NOMINATION_POOL:
      case YieldPoolType.LIQUID_STAKING:
      default:
        return t('Stake now');
    }
  }, [t, type, isAvailable]);

  const totalTitle = useMemo(() => {
    switch (type) {
      case YieldPoolType.LENDING:
        return t('Total value supplied');
      case YieldPoolType.NOMINATION_POOL:
      case YieldPoolType.LIQUID_STAKING:
      default:
        return t('Total value staked');
    }
  }, [t, type]);

  const childClick = useCallback((onClick: VoidFunction) => {
    return (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      onClick();
    };
  }, []);

  const exclusiveRewardTagNode = useMemo(() => {
    if (!EXCLUSIVE_REWARD_SLUGS.includes(item.slug)) {
      return null;
    }

    const label = t(ExclusiveRewardContentMap[item.slug] || 'No content');

    return (
      <Tooltip
        placement={'top'}
        title={label}
      >
        <div
          className={'exclusive-reward-tag-wrapper'}
          onClick={childClick(openInNewTab('https://docs.subwallet.app/main/web-dashboard-user-guide/earning/faqs#exclusive-rewards'))}
        >
          <EarningTypeTag className={compactMode ? '__item-tag' : 'earning-item-tag'} />
        </div>
      </Tooltip>
    );
  }, [item.slug, childClick, compactMode, t]);

  if (compactMode) {
    return (
      <div
        className={CN(className, '-compact-mode')}
        onClick={isAvailable ? onClickInfoBtn : undefined}
      >
        <div className={'__item-upper-part'}>
          <Logo
            className={'__item-logo'}
            network={logo || chain}
            size={38}
          />

          <div className='__item-lines-container'>
            <div className='__item-line-1'>
              <div className='__item-name'>{name}</div>
              <div className='__item-rewards'>
                <div className='__item-rewards-label'>
                  {t('Rewards')}:
                </div>
                <div className='__item-rewards-value'>
                  {
                    !isAvailable && totalApy <= 0
                      ? <div className={'earning-item-not-available-title'}>TBD</div>
                      : (
                        <Number
                          decimal={0}
                          suffix={'%'}
                          value={totalApy}
                        />
                      )
                  }
                </div>
              </div>
            </div>
            <div className='__item-line-2'>
              <div className='__item-total-staked-label'>
                {t('Total value staked')}:
              </div>
              <div className='__item-total-staked-value'>
                {
                  !isAvailable && parseInt(tvl) <= 0
                    ? <div className={'earning-item-not-available-info'}>TBD</div>
                    : (
                      <Number
                        decimal={0}
                        prefix={'$'}
                        value={tvl}
                      />
                    )
                }
              </div>
            </div>
          </div>
        </div>
        <div className={'__item-lower-part'}>
          <div className='__item-tags-container'>
            {!isAvailable && (
              <EarningTypeTag
                className={'__item-tag'}
                comingSoon={true}
              />
            )}
            <EarningTypeTag
              className={'__item-tag'}
              type={type}
            />
            {exclusiveRewardTagNode}
          </div>
          <div className='__item-buttons-container'>
            <Button
              className={'__item-stake-more-button'}
              disabled={!isAvailable}
              icon={(
                <Icon
                  iconColor={token.colorPrimary}
                  phosphorIcon={PlusCircle}
                  size='sm'
                  weight='fill'
                />
              )}
              onClick={childClick(onClickStakeBtn)}
              size='xs'
              type='ghost'
            />

            <Button
              className={'__item-calculator-button'}
              disabled={!isAvailable}
              icon={(
                <Icon
                  phosphorIcon={PlusMinus}
                  size='sm'
                />
              )}
              onClick={childClick(onClickCalculatorBtn)}
              shape='circle'
              size='xs'
              type='ghost'
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Web3Block
      className={className}
      middleItem={(
        <div className={'earning-item-content-wrapper'}>
          <Logo
            network={logo || chain}
            size={64}
          />

          <div className={'earning-item-message-wrapper'}>
            <div className={'earning-item-name'}>{name}</div>
            <div className={'earning-item-description'}>{description}</div>
          </div>

          <div className='earning-item-tags-container'>
            {!isAvailable && (
              <EarningTypeTag
                className={'__item-tag'}
                comingSoon={true}
              />
            )}
            <EarningTypeTag
              className={'earning-item-tag'}
              type={type}
            />

            {exclusiveRewardTagNode}
          </div>

          <div className={'earning-item-reward'}>
            {
              !isAvailable && totalApy <= 0
                ? <div className={'earning-item-not-available-title'}>TBD</div>
                : <Number
                  decimal={0}
                  size={30}
                  suffix={'%'}
                  value={totalApy}
                />
            }

            <div className={'earning-item-reward-sub-text'}>{t('rewards')}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: token.paddingXXS }}>
            <div className='earning-item-total-value-staked'>{totalTitle}:</div>

            {
              !isAvailable && parseInt(tvl) <= 0
                ? <div className='earning-item-not-available-info'>TBD</div>
                : <Number
                  decimal={0}
                  decimalColor={token.colorSuccess}
                  intColor={token.colorSuccess}
                  prefix={'$'}
                  size={14}
                  unitColor={token.colorSuccess}
                  value={tvl}
                />
            }
          </div>

          <div className='earning-item-footer'>
            <Button
              className='earning-item-icon-btn'
              disabled={!isAvailable}
              icon={(
                <Icon
                  phosphorIcon={PlusMinus}
                  size='sm'
                />
              )}
              onClick={childClick(onClickCalculatorBtn)}
              shape='circle'
              size='xs'
              tooltip={t('Earning calculator')}
              type='ghost'
            />
            <Button
              className='earning-item-icon-btn'
              disabled={!isAvailable}
              icon={(
                <Icon
                  phosphorIcon={Question}
                  size='sm'
                  weight='fill'
                />
              )}
              onClick={childClick(onClickInfoBtn)}
              shape='circle'
              size='xs'
              tooltip={t('Earning information')}
              type='ghost'
            />
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
              onClick={childClick(onClickStakeBtn)}
              shape='circle'
              size='xs'
            >
              {submitText}
            </Button>
          </div>
        </div>
      )}
      onClick={isAvailable ? onClickInfoBtn : undefined}
    />
  );
};

const EarningItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    cursor: 'pointer',
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    padding: `${token.paddingXL}px ${token.paddingLG}px ${token.padding}px`,

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

export default EarningItem;
