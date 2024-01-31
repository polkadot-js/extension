// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import { MetaInfo } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { PhosphorIcon, Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, ButtonProps, Icon, Logo, Number, Tooltip } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, PlusMinus, Question } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import EarningTypeTag from '../../../components/Earning/EarningTypeTag';

interface Props extends ThemeProps {
  compactMode?: boolean;
  onClickCalculatorBtn?: () => void;
  onClickCancelUnStakeBtn?: () => void;
  onClickClaimBtn?: () => void;
  onClickItem?: () => void;
  onClickInfoBtn?: () => void;
  onClickStakeBtn?: () => void;
  onClickUnStakeBtn?: () => void;
  onClickWithdrawBtn?: () => void;
  onClickMoreBtn?: () => void; // compactMode only
  nominationPoolReward?: StakingRewardItem;
}

interface ButtonOptionProps {
  icon: PhosphorIcon;
  label?: string;
  tooltip?: string;
  key: string;
  onClick?: React.MouseEventHandler;
  disable: boolean;
  hidden: boolean;
  schema?: ButtonProps['schema'];
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const isAvailable = true;

  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const line3Ref = useRef<HTMLDivElement | null>(null);
  const line3LeftPartRef = useRef<HTMLDivElement | null>(null);
  const line3RightPartRef = useRef<HTMLDivElement | null>(null);

  const [isCompactButtons, setCompactButtons] = useState<boolean>(false);

  useEffect(() => {
    const updateCompactButtons = () => {
      if (line3Ref.current && line3LeftPartRef.current && line3RightPartRef.current) {
        const line3 = line3Ref.current.clientWidth;
        const line3LeftPart = line3LeftPartRef.current.clientWidth;
        const line3RightPart = line3RightPartRef.current.clientWidth;

        if (line3LeftPart + 16 + line3RightPart > line3) {
          setCompactButtons(true);
        } else {
          setCompactButtons(false);
        }
      }
    };

    updateCompactButtons();

    window.addEventListener('resize', updateCompactButtons);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', updateCompactButtons);
    };
  }, []);

  const onClickButton = useCallback(() => {
    alert('nguyen dung');
  }, []);
  const getButtons = useCallback((compact?: boolean): ButtonOptionProps[] => {
    const result: ButtonOptionProps[] = [];

    // Calculator
    result.push({
      disable: !isAvailable,
      icon: PlusMinus,
      onClick: onClickButton,
      key: 'calculator',
      hidden: false,
      schema: 'secondary',
      tooltip: t('Earning calculator')
    });

    // Info
    result.push({
      disable: !isAvailable,
      icon: Question,
      onClick: onClickButton,
      key: 'info',
      hidden: false,
      schema: 'secondary',
      tooltip: t('Earning information')
    });

    // const actionListByChain = useMemo(() => {
    //   return [];
    // }, []);

    // actionListByChain.forEach((item) => {
    //   const temp: ButtonOptionProps = {
    //     disable: false,
    //     key: item,
    //     hidden: false
    //   } as ButtonOptionProps;
    //
    //   switch (item) {
    //     case YieldAction.STAKE:
    //
    //       // eslint-disable-next-line no-fallthrough
    //     case YieldAction.START_EARNING: {
    //       const text = isAvailable ? t('Supply now') : t('Stake now');
    //
    //       temp.icon = PlusCircle;
    //       temp.label = !compact ? text : undefined;
    //       temp.tooltip = compact ? text : undefined;
    //       temp.onClick = onClickButton;
    //       break;
    //     }
    //
    //     case YieldAction.CLAIM_REWARD:
    //       temp.icon = Wallet;
    //       temp.onClick = onClickButton;
    //       temp.label = !compact ? t('Claim rewards') : undefined;
    //       temp.tooltip = compact ? t('Claim rewards') : undefined;
    //       break;
    //     case YieldAction.WITHDRAW:
    //     case YieldAction.WITHDRAW_EARNING:
    //       temp.icon = StopCircle;
    //       temp.onClick = onClickButton;
    //       temp.label = !compact ? t('Withdraw') : undefined;
    //       temp.tooltip = compact ? t('Withdraw') : undefined;
    //       temp.schema = 'secondary';
    //       break;
    //     case YieldAction.UNSTAKE:
    //       temp.icon = MinusCircle;
    //       temp.onClick = onClickButton;
    //       temp.label = !compact ? t('Unstake') : undefined;
    //       temp.tooltip = compact ? t('Unstake') : undefined;
    //       temp.schema = 'secondary';
    //       break;
    //     case YieldAction.CANCEL_UNSTAKE:
    //       temp.icon = MinusCircle;
    //       temp.onClick = onClickButton;
    //       temp.label = !compact ? t('Cancel unstake') : undefined;
    //       temp.tooltip = compact ? t('Cancel unstake') : undefined;
    //       temp.schema = 'secondary';
    //       break;
    //   }
    //
    //   result.push(temp);
    // });

    return result;
  }, [isAvailable, onClickButton, t]);

  const childClick = useCallback((onClick: VoidFunction) => {
    return (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      onClick();
    };
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
          <EarningTypeTag className={'earning-item-tag'} />
        </div>
      </Tooltip>
    );
  }, [childClick, t]);

  const checkShowedMock = false;

  return (
    <div
      className={CN(className, '-normal-mode')}
      onClick={onClickButton}
    >
      <Logo
        className='earning-item-logo'
        network={'polkadot'}
        size={64}
      />

      <div className='earning-item-lines-container'>
        <div className='earning-item-line-1 earning-item-line'>
          <div className={'earning-item-name-wrapper'}>
            <div className={'earning-item-name'}>{'Polkadot'}</div>
            {
              !isAvailable &&
                            (
                              <EarningTypeTag
                                className={'earning-item-tag'}
                                comingSoon={true}
                              />
                            )
            }
            <EarningTypeTag
              className={'earning-item-tag'}
              type={''}
            />

            {exclusiveRewardTagNode}
          </div>

          <MetaInfo>
            <MetaInfo.Status
              className={'earning-status-item'}
              statusIcon={CheckCircle}
              statusName={t('Earning rewards')}
              valueColorSchema={'success'}
            />
          </MetaInfo>
        </div>

        <div className='earning-item-line-2 earning-item-line'>
          <div className={'earning-item-description'}>{'Stake any amount of ETH, get daily staking rewards and use your stETH across the DeFi ecosystem and L2.'}</div>

          <div className='earning-item-total-balance-value'>
            <Number
              decimal={8}
              decimalOpacity={0.4}
              size={30}
              suffix={'$'}
              unitOpacity={0.4}
              value={'12345'} // TODO
            />
          </div>
        </div>

        <div
          className='earning-item-line-3 earning-item-line'
          ref={line3Ref}
        >
          <div className={CN('earning-item-buttons-wrapper', { '-compact': isCompactButtons })}>
            <div
              className='earning-item-buttons'
            >
              {getButtons(true).map((item) => {
                return (
                  <Button
                    className='earning-action'
                    disabled={item.disable}
                    icon={(
                      <Icon
                        className={'earning-item-stake-btn'}
                        phosphorIcon={item.icon}
                        size='sm'
                        weight='fill'
                      />
                    )}
                    key={item.key}
                    onClick={item.onClick}
                    schema={item.schema}
                    shape='circle'
                    size='xs'
                    tooltip={item.tooltip}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </div>

            <div
              className='earning-item-shadow-buttons'
              ref={line3LeftPartRef}
            >
              {getButtons().map((item) => {
                return (
                  <Button
                    className='earning-action'
                    disabled={item.disable}
                    icon={(
                      <Icon
                        className={'earning-item-stake-btn'}
                        phosphorIcon={item.icon}
                        size='sm'
                        weight='fill'
                      />
                    )}
                    key={item.key}
                    onClick={item.onClick}
                    schema={item.schema}
                    shape='circle'
                    size='xs'
                    tooltip={item.tooltip}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div
            className={'earning-item-label-and-value'}
            ref={line3RightPartRef}
          >
            {
              <div className={'earning-item-equivalent'}>
                <div className={'earning-item-equivalent-label'}>
                  {t('Equivalent to:')}
                </div>

                <div className={'earning-item-equivalent-value'}>
                  <Number
                    decimal={9}
                    decimalColor={token.colorSuccess}
                    intColor={token.colorSuccess}
                    suffix={'KSM'}
                    unitColor={token.colorSuccess}
                    value={77777}
                  />
                </div>
              </div>
            }

            {checkShowedMock &&
              <div className={'earning-item-unclaimed-rewards'}>
                <div className={'earning-item-unclaimed-rewards-label'}>
                  {t('Unclaimed rewards:')}
                </div>
                <div className={'earning-item-unclaimed-rewards-value'}>
                  <Number
                    decimal={10}
                    decimalColor={token.colorSuccess}
                    intColor={token.colorSuccess}
                    suffix={'DOT'}
                    unitColor={token.colorSuccess}
                    value={'11110'}
                  />
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

const EarningPositionsItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    cursor: 'pointer',

    '&.-normal-mode': {
      padding: `${token.paddingXL}px ${token.paddingMD}px ${token.padding}px`,
      display: 'flex',

      '&:hover': {
        backgroundColor: token.colorBgInput
      }
    },

    '.earning-item-logo': {
      marginRight: token.size
    },

    '.earning-item-lines-container': {
      overflow: 'hidden',
      flex: 1
    },

    '.earning-item-line': {
      display: 'flex',
      justifyContent: 'space-between',
      overflow: 'hidden',
      gap: token.size
    },

    '.earning-item-line-1': {
      marginBottom: 2
    },

    '.earning-item-name-wrapper': {
      display: 'flex',
      alignItems: 'center',
      gap: token.paddingSM,
      overflow: 'hidden'
    },

    '.earning-status-item, .earning-item-total-balance-value': {
      'white-space': 'nowrap'
    },

    '.earning-item-name': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: 600,
      color: token.colorTextLight1,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.earning-item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.earning-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: 500,
      color: token.colorTextLight4,
      display: '-webkit-box',
      '-webkit-line-clamp': '2',
      '-webkit-box-orient': 'vertical',
      overflow: 'hidden'
    },

    '.earning-item-total-balance-value': {
      fontSize: 30,
      lineHeight: `${38}px`,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight,

      '.ant-number, .ant-number-integer': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal, .ant-number-suffix': {
        color: 'inherit !important',
        fontSize: '24px !important',
        fontWeight: 'inherit !important',
        lineHeight: `${24}px`
      }
    },

    '.earning-item-line-2': {
      marginBottom: token.marginXXS
    },

    '.earning-item-label-and-value': {
      overflow: 'hidden'
    },

    '.earning-item-icon-btn': {
      border: `2px solid ${token.colorBgBorder}`,
      borderRadius: '50%'
    },

    '.earning-item-stake-btn': {
      width: token.sizeMD,
      height: token.sizeMD
    },

    '.earning-status-item': {
      display: 'block'
    },

    '.earning-action': {
      '&.ant-btn-default.-schema-secondary': {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: token.colorBgBorder,

        '&:hover:not(:disabled)': {
          borderColor: token['gray-2']
        }
      }
    },

    '.earning-item-equivalent, .earning-item-unclaimed-rewards': {
      display: 'flex',
      'white-space': 'nowrap',
      overflow: 'hidden',
      gap: token.sizeXXS,
      fontWeight: token.headingFontWeight,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },

    '.earning-item-equivalent-label, .earning-item-unclaimed-rewards-label': {
      color: token.colorTextLight4,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.earning-item-equivalent-value, .earning-item-unclaimed-rewards-value': {
      '.ant-number .ant-typography': {
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit',
        textAlign: 'end'
      }
    },

    '.earning-item-buttons, .earning-item-shadow-buttons': {
      display: 'flex',
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingXS
    },

    '.earning-item-buttons': {
      gap: token.paddingSM
    },

    '.earning-item-shadow-buttons': {
      gap: token.paddingSM,
      position: 'absolute',
      left: 0,
      top: 0
    },

    '.earning-item-buttons-wrapper': {
      position: 'relative',

      '.earning-item-buttons': {
        opacity: 0,
        pointerEvents: 'none'
      },

      '.earning-item-shadow-buttons': {
        opacity: 1,
        pointerEvents: 'auto'
      },

      '&.-compact': {
        '.earning-item-buttons': {
          opacity: 1,
          pointerEvents: 'auto'
        },

        '.earning-item-shadow-buttons': {
          opacity: 0,
          pointerEvents: 'none'
        }
      }
    },

    // compact mode style
    '&.-compact-mode': {
      paddingTop: token.sizeSM,
      paddingLeft: token.sizeSM,
      paddingRight: token.sizeSM,
      paddingBottom: 0
    },

    '.__item-logo': {
      marginRight: token.marginSM
    },

    '.__item-lines-container': {
      flex: 1,
      overflow: 'hidden'
    },

    '.__item-line-1, .__item-line-2': {
      display: 'flex',
      justifyContent: 'space-between',
      gap: token.sizeSM
    },

    '.__item-line-1': {
      'white-space': 'nowrap',
      marginBottom: token.marginXXS
    },

    '.__item-button': {
      '&:disabled': {
        opacity: 0.4
      }
    },

    '.__item-name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight,
      overflow: 'hidden',
      'white-space': 'nowrap',
      textOverflow: 'ellipsis'
    },

    '.__item-status': {
      '.__status-icon': {
        fontSize: `${token.size}px !important`
      },

      '.__status-name': {
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM
      }
    },

    '.__item-total-balance-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight,

      '.ant-number, .ant-number-integer': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal, .ant-number-suffix': {
        color: 'inherit !important',
        fontSize: `${token.fontSize}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeight
      }
    },

    '.__item-equivalent-value, .__item-unclaimed-rewards-value': {
      color: token.colorSuccess,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,

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

export default EarningPositionsItem;
