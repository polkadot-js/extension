// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AddressInput } from '@subwallet/extension-web-ui/components';
import { CROWDLOAN_UNLOCK_TIME, WIKI_URL } from '@subwallet/extension-web-ui/constants';
import { DEFAULT_CROWDLOAN_UNLOCK_TIME } from '@subwallet/extension-web-ui/constants/event';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import Countdown from '@subwallet/extension-web-ui/Popup/CrowdloanUnlockCampaign/components/Countdown';
import NoteBox from '@subwallet/extension-web-ui/Popup/CrowdloanUnlockCampaign/components/NoteBox';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { Theme } from '@subwallet/extension-web-ui/themes';
import { FormCallbacks, ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, ButtonProps, Form, Icon, Image, SwHeader } from '@subwallet/react-ui';
import { ValidateStatus } from '@subwallet/react-ui/es/form/FormItem';
import { ArrowCounterClockwise, PlusCircle, Question, Vault, Wallet } from 'phosphor-react';
import React, { Context, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate, useOutletContext } from 'react-router-dom';
import styled, { ThemeContext } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

type SubmitResponse = {
  status?: ValidateStatus;
  message?: string;
};

export interface FormParams {
  address: string;
}

const Component: React.FC<Props> = ({ className = '' }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;
  const [{ message: responseMessage, status: responseStatus }, setSubmitResponse] =
    useState<SubmitResponse>({});
  const [isWrongAddress, setIsWrongAddress] = useState<boolean>(false);
  const logoMap = useContext<Theme>(ThemeContext as Context<Theme>).logoMap;
  const { setWebBaseClassName } = useContext(WebUIContext);
  const [crowdloanUnlockTime] = useLocalStorage<number>(CROWDLOAN_UNLOCK_TIME, DEFAULT_CROWDLOAN_UNLOCK_TIME);
  const { isWebUI } = useContext(ScreenContext);

  const outletContext: {
    crowdloanUnlockTime: number,
  } = useOutletContext();

  const targetCrowdloanUnlockTime = outletContext?.crowdloanUnlockTime || crowdloanUnlockTime;

  const formDefault = useMemo((): FormParams => {
    return {
      address: ''
    };
  }, []);

  const [form] = Form.useForm<FormParams>();

  const addressValue = Form.useWatch('address', form);

  const onCheckCrowdloanContributions: FormCallbacks<FormParams>['onFinish'] = useCallback(({ address }: FormParams) => {
    if (isAddress(address)) {
      navigate('/crowdloan-unlock-campaign/contributions-result', { state: { address } });
    } else {
      setSubmitResponse({
        status: 'error',
        message: t('Invalid address. Check again or create a new account to get started.')
      });
      setIsWrongAddress(true);
    }
  }, [navigate, t]);

  const onValuesChange: FormCallbacks<FormParams>['onValuesChange'] = useCallback(
    () => {
      setSubmitResponse({});
    },
    []
  );

  const goEarningDemo = useCallback(() => {
    openInNewTab(`${window.location.origin}/earning-preview`)();
  }, []);

  const { isNoAccount } = useSelector((state: RootState) => state.accountState);

  const onClickCreateNewWallet = useCallback(() => {
    if (isNoAccount) {
      openInNewTab(`${window.location.origin}/welcome`)();
    } else {
      openInNewTab(`${window.location.origin}/home/tokens`)();
    }
  }, [isNoAccount]);

  useEffect(() => {
    setWebBaseClassName(`${className}-web-base-container`);

    return () => {
      setWebBaseClassName('');
    };
  }, [className, setWebBaseClassName]);

  const headerIcons = useMemo<ButtonProps[]>(() => {
    return [
      {
        icon: (
          <Icon
            customSize={'24px'}
            phosphorIcon={Question}
            type='phosphor'
          />
        ),
        onClick: openInNewTab(WIKI_URL)
      }
    ];
  }, []);

  return (
    <div className={className}>
      {
        !isWebUI && (
          <SwHeader
            background={'transparent'}
            className={'__header-area'}
            left='logo'
            paddingVertical
            rightButtons={headerIcons}
            showLeftButton={true}
          />
        )
      }

      <div className={'__body-area'}>
        <div className='__countdown-area'>
          <div className='__countdown-icon'>
            <Image
              height={'100%'}
              shape={'circle'}
              src={logoMap.network.rocketIcon as string}
              width={'100%'}
            />
          </div>
          <div className={'__countdown-title'}>
            {t('Next Polkadot crowdloan unlocking in')}
          </div>
          <Countdown
            className={'__countdown'}
            targetTime={targetCrowdloanUnlockTime}
          />
        </div>

        <div className='__form-area'>
          <Form
            className={'__form-container'}
            form={form}
            initialValues={formDefault}
            onFinish={onCheckCrowdloanContributions}
            onValuesChange={onValuesChange}
          >
            <Form.Item
              help={responseMessage}
              name={'address'}
              statusHelpAsTooltip={isWebUI}
              validateStatus={responseStatus}
            >
              <AddressInput
                placeholder={t('Enter your Polkadot wallet address')}
                prefix={(
                  <Icon
                    phosphorIcon={Wallet}
                    size='md'
                  />
                )}
                showDisplayOverlay={false}
                showLabel={false}
                showPlainAddressOnly
                showScanner
              />
            </Form.Item>
          </Form>

          {
            !isWrongAddress && (
              <Button
                block
                className='__check-contributions-button'
                disabled={!addressValue}
                onClick={form.submit}
                schema='primary'
              >
                {t('Check your crowdloan contributions')}
              </Button>
            )
          }

          {
            isWrongAddress && (
              <div className='__form-buttons'>
                <Button
                  block
                  className='__check-again-button'
                  disabled={!addressValue || responseStatus === 'error'}
                  icon={
                    <Icon
                      customSize={'28px'}
                      phosphorIcon={ArrowCounterClockwise}
                      weight='fill'
                    />
                  }
                  onClick={form.submit}
                  schema='secondary'
                >
                  {t('Check again')}
                </Button>

                <Button
                  block
                  className='__create-a-wallet-button'
                  icon={
                    <Icon
                      customSize={'28px'}
                      phosphorIcon={PlusCircle}
                      weight='fill'
                    />
                  }
                  onClick={onClickCreateNewWallet}
                  schema='primary'
                >
                  {t('Create a new account')}
                </Button>
              </div>
            )
          }
        </div>
      </div>

      <div className={'__footer-area'}>
        <NoteBox
          className={'__note-box'}
          content={t('There\'re multiple ways you can play with your unlocked DOT, such as native staking, liquid staking, or lending. Check out SubWallet Dashboard for curated options with competitive APY to earn yield on your DOT.')}
          title={t('Crowdloan unlock, then what?')}
        />

        <div className='__footer-buttons'>
          <Button
            className={'__footer-button'}
            contentAlign={'left'}
            icon={
              <Icon
                className='__footer-button-icon'
                iconColor={token['green-6']}
                phosphorIcon={Vault}
                size='md'
                weight='fill'
              />
            }
            onClick={goEarningDemo}
            schema={'secondary'}
          >
            <div className={'__footer-button-content'}>
              <div className={'__footer-button-title'}>{t('Rewards: 14.8% - 18.5 %')}</div>

              <div className={'__footer-button-subtitle'}>{t('Earn with SubWallet Dashboard')}</div>
            </div>
          </Button>

          <Button
            className={'__footer-button'}
            contentAlign={'left'}
            icon={
              <Icon
                className='__footer-button-icon'
                iconColor={token['yellow-6']}
                phosphorIcon={Question}
                size='md'
                weight='fill'
              />
            }
            onClick={openInNewTab('https://docs.subwallet.app/main/web-dashboard-user-guide/earning/faqs')}
            schema={'secondary'}
          >
            <div className={'__footer-button-content'}>
              <div className={'__footer-button-title'}>{t('Frequently asked questions')}</div>

              <div className={'__footer-button-subtitle'}>{t('Learn more about our solution')}</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

const CheckCrowdloanContributions = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    paddingLeft: token.padding,
    paddingRight: token.padding,
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'fixed',
    inset: 0,
    maxWidth: 816,
    marginLeft: 'auto',
    marginRight: 'auto',
    overflow: 'auto',

    '&-web-base-container': {
      '.web-layout-header-simple': {
        '.__back-button, .__title-wrapper': {
          display: 'none'
        }
      }
    },

    '.__header-area': {
      alignSelf: 'stretch',
      marginLeft: -token.margin,
      marginRight: -token.margin,
      position: 'sticky',
      top: 0,
      zIndex: 10,
      minHeight: 'auto',
      backgroundColor: token.colorBgDefault
    },

    '.__countdown-area': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },

    '.__countdown-icon': {
      width: 104,
      height: 104,
      color: token.colorTextLight1,
      marginBottom: 52
    },

    '.__countdown-title': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      color: token.colorTextLight3,
      fontWeight: token.headingFontWeight,
      marginBottom: token.margin,
      textAlign: 'center'
    },

    '.__countdown': {
      marginBottom: 60
    },

    '.__body-area': {
      paddingTop: 112,
      maxWidth: 584,
      flex: 1,
      width: '100%'
    },

    '.__form-area': {
      display: 'flex',
      flexDirection: 'column',
      marginBottom: 80
    },

    '.__form-container': {
      paddingBottom: token.sizeXS
    },

    '.__check-contributions-button': {
      maxWidth: 384,
      alignSelf: 'center',

      '.ant-btn-content-wrapper': {
        'white-space': 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden'
      }
    },

    '.__form-buttons': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.size
    },

    '.__check-again-button, .__create-a-wallet-button': {
      flex: 1
    },

    '.__footer-area': {
      borderTop: `2px solid ${token.colorBgDivider}`,
      paddingBottom: 58
    },

    '.__note-box': {
      paddingTop: token.sizeLG,
      paddingBottom: token.sizeLG
    },

    '.__footer-buttons': {
      display: 'flex',
      gap: token.size,
      flexWrap: 'wrap'
    },

    '.__footer-button': {
      height: 72,
      flex: 1,
      paddingRight: token.paddingSM,
      paddingLeft: token.paddingSM,
      gap: token.size
    },

    '.__footer-button-icon': {
      width: 40,
      height: 40,
      justifyContent: 'center'
    },

    '.__footer-button-content': {
      textAlign: 'left'
    },

    '.__footer-button-title': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      marginBottom: token.marginXXS
    },

    '.__footer-button-subtitle': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight3
    },

    '@media (max-width: 991px)': {
      '.__countdown-icon': {
        width: 88,
        height: 88
      },

      '.__countdown-title': {
        fontSize: token.fontSize,
        lineHeight: token.lineHeight
      },

      '.__form-area': {
        marginBottom: 140
      },

      '.__body-area': {
        paddingTop: 56
      },

      '.__countdown': {
        '.__time-item-number': {
          fontSize: token.fontSizeHeading3,
          lineHeight: token.lineHeightHeading3
        },
        '.__time-item-unit': {
          fontSize: token.fontSizeSM,
          lineHeight: token.lineHeightSM
        },
        '.__time-separator': {
          fontSize: token.fontSizeHeading3,
          lineHeight: token.lineHeightHeading3
        }
      },

      '.__note-box': {
        paddingTop: token.size,
        paddingBottom: token.size
      }
    },

    '@media (max-width: 767px)': {
      '.__form-buttons': {
        '.ant-btn': {
          minWidth: '100%'
        }
      }
    }
  };
});

export default CheckCrowdloanContributions;
