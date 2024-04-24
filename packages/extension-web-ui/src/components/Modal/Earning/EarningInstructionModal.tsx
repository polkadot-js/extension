// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { balanceFormatter, detectTranslate, formatNumber } from '@subwallet/extension-base/utils';
import { BaseModal, InstructionItem } from '@subwallet/extension-web-ui/components';
import { getInputValuesFromString } from '@subwallet/extension-web-ui/components/Field/AmountInput';
import { EARNING_DATA_RAW, EARNING_INSTRUCTION_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { earlyValidateJoin } from '@subwallet/extension-web-ui/messaging';
import { AlertDialogProps, PhosphorIcon, ThemeProps } from '@subwallet/extension-web-ui/types';
import { getBannerButtonIcon } from '@subwallet/extension-web-ui/utils';
import { BackgroundIcon, Button, Icon, ModalContext } from '@subwallet/react-ui';
import { getAlphaColor } from '@subwallet/react-ui/lib/theme/themes/default/colorAlgorithm';
import CN from 'classnames';
import { CaretCircleLeft, CaretDown, CheckCircle, PlusCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  poolInfo: YieldPoolInfo | undefined;
  onCancel?: VoidFunction;
  onStakeMore?: (slug: string, chain: string) => void;
  isShowStakeMoreButton?: boolean;
  openAlert: (alertProps: AlertDialogProps) => void;
  closeAlert: VoidFunction;
  assetRegistry: Record<string, _ChainAsset>;
  address?: string;
  bypassEarlyValidate?: boolean;
  customButtonTitle?: string;
}

export interface BoxProps {
  id: string;
  title: string;
  description: string;
  iconColor: string;
  icon: PhosphorIcon;
}

const modalId = EARNING_INSTRUCTION_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { address, assetRegistry, bypassEarlyValidate, className, closeAlert, customButtonTitle, isShowStakeMoreButton = true, onCancel, onStakeMore, openAlert, poolInfo } = props;
  const checkRef = useRef<number>(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const [loading, setLoading] = useState(false);
  const [isScrollEnd, setIsScrollEnd] = useState(false);
  const [isDisableEarnButton, setDisableEarnButton] = useState(true);
  const title = useMemo(() => {
    if (!poolInfo) {
      return '';
    }

    const { metadata: { inputAsset },
      type } = poolInfo;
    const totalApy = poolInfo.statistic?.totalApy;
    const totalApr = poolInfo.statistic?.totalApr;
    const minJoinPool = poolInfo.statistic?.earningThreshold.join || '0';

    const getOrigin = () => {
      switch (type) {
        case YieldPoolType.NOMINATION_POOL:
        case YieldPoolType.NATIVE_STAKING:
        case YieldPoolType.LIQUID_STAKING:
          return 'Earn up to {{apy}} yearly from {{minActiveStake}} with {{shortName}}';
        case YieldPoolType.LENDING:
          return 'Earn up to {{apy}} yearly from {{minActiveStake}} with {{shortName}}';
      }
    };

    const getApy = () => {
      if (totalApy) {
        return totalApy;
      }

      if (totalApr) {
        const rs = calculateReward(totalApr);

        return rs.apy;
      }

      return undefined;
    };

    let result = getOrigin();
    const apy = getApy();
    const asset = assetRegistry[inputAsset];
    const shortName = poolInfo.metadata.shortName;

    if (asset) {
      if (Number(minJoinPool) === 0 && !apy) {
        result = 'Earn {{token}} with {{network}}';
        result = result.replace('{{token}}', asset.symbol);
        result = result.replace('{{network}}', shortName);
      }

      if (Number(minJoinPool) === 0) {
        result = result.replace(' from {{minActiveStake}}', '');
      } else {
        const string = formatNumber(minJoinPool, asset.decimals || 0, balanceFormatter);

        result = result.replace('{{minActiveStake}}', `${string} ${asset.symbol}`);
      }
    } else {
      result = result.replace('from ', '');
    }

    if (apy) {
      const string = formatNumber(apy, 0, balanceFormatter);

      result = result.replace('{{apy}}', `${string}%`);
    } else {
      result = result.replace('up to {{apy}} ', '');
    }

    if (shortName) {
      result = result.replace('{{shortName}}', shortName);
    }

    return result;
  }, [assetRegistry, poolInfo]);

  const buttonTitle = useMemo(() => {
    if (!poolInfo) {
      return '';
    }

    const { type } = poolInfo;

    switch (type) {
      case YieldPoolType.NOMINATION_POOL:
      case YieldPoolType.NATIVE_STAKING:
      case YieldPoolType.LIQUID_STAKING:
        return 'Stake to earn';
      case YieldPoolType.LENDING:
        return 'Supply to earn';
    }
  }, [poolInfo]);

  const setVisible = useCallback(
    (show: boolean) => {
      checkRef.current = Date.now();

      if (show) {
        activeModal(modalId);
      } else {
        inactiveModal(modalId);
      }
    },
    [activeModal, inactiveModal]
  );

  const replaceEarningValue = useCallback((target: BoxProps, searchString: string, replaceValue: string) => {
    if (target.title.includes(searchString)) {
      target.title = target.title.replace(searchString, replaceValue);
    }

    if (target.description?.includes(searchString)) {
      target.description = target.description.replaceAll(searchString, replaceValue);
    }
  }, []);

  const convertTime = useCallback((_number?: number): string => {
    if (_number !== undefined) {
      const isDay = _number > 24;
      const time = isDay ? Math.floor(_number / 24) : _number;
      const unit = isDay ? (time === 1 ? 'day' : 'days') : time === 1 ? 'hour' : 'hours';

      return [time, unit].join(' ');
    } else {
      return 'unknown time';
    }
  }, []);

  const unBondedTime = useMemo((): string => {
    if (!poolInfo) {
      return '';
    }

    let time: number | undefined;

    if (poolInfo.statistic && 'unstakingPeriod' in poolInfo.statistic) {
      time = poolInfo.statistic.unstakingPeriod;
    }

    return convertTime(time);
  }, [poolInfo, convertTime]);

  const data: BoxProps[] = useMemo(() => {
    if (!poolInfo) {
      return [];
    }

    switch (poolInfo.type) {
      case YieldPoolType.NOMINATION_POOL: {
        const _label = getValidatorLabel(poolInfo.chain);
        const maxCandidatePerFarmer = poolInfo.statistic?.maxCandidatePerFarmer || 0;
        const label = `${_label.charAt(0).toLowerCase() + _label.substr(1)}${maxCandidatePerFarmer > 1 ? 's' : ''}`;
        const inputAsset = assetRegistry[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistry[poolInfo.metadata.maintainAsset];
        const paidOut = poolInfo.statistic?.eraTime;

        if (inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          return EARNING_DATA_RAW[YieldPoolType.NOMINATION_POOL].map((item) => {
            const _item: BoxProps = { ...item, icon: getBannerButtonIcon(item.icon) as PhosphorIcon, id: item.icon };

            replaceEarningValue(_item, '{validatorNumber}', maxCandidatePerFarmer.toString());
            replaceEarningValue(_item, '{validatorType}', label);
            replaceEarningValue(_item, '{periodNumb}', unBondedTime);
            replaceEarningValue(_item, '{maintainBalance}', maintainBalance);
            replaceEarningValue(_item, '{maintainSymbol}', maintainSymbol);

            if (paidOut !== undefined) {
              replaceEarningValue(_item, '{paidOut}', paidOut.toString());
              replaceEarningValue(_item, '{paidOutTimeUnit}', paidOut > 1 ? 'hours' : 'hour');
            }

            return _item;
          });
        } else {
          return [];
        }
      }

      case YieldPoolType.NATIVE_STAKING: {
        const _label = getValidatorLabel(poolInfo.chain);
        const maxCandidatePerFarmer = poolInfo.statistic?.maxCandidatePerFarmer || 0;
        const label = `${_label.charAt(0).toLowerCase() + _label.substr(1)}${maxCandidatePerFarmer > 1 ? 's' : ''}`;
        const inputAsset = assetRegistry[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistry[poolInfo.metadata.maintainAsset];
        const paidOut = poolInfo.statistic?.eraTime;

        if (inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          if (_STAKING_CHAIN_GROUP.astar.includes(poolInfo.chain)) {
            return EARNING_DATA_RAW.DAPP_STAKING.map((item) => {
              const _item: BoxProps = { ...item, id: item.icon, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

              replaceEarningValue(_item, '{validatorNumber}', maxCandidatePerFarmer.toString());
              replaceEarningValue(_item, '{dAppString}', maxCandidatePerFarmer > 1 ? 'dApps' : 'dApp');
              replaceEarningValue(_item, '{periodNumb}', unBondedTime);
              replaceEarningValue(_item, '{maintainBalance}', maintainBalance);
              replaceEarningValue(_item, '{maintainSymbol}', maintainSymbol);

              if (paidOut !== undefined) {
                replaceEarningValue(_item, '{paidOut}', paidOut.toString());
                replaceEarningValue(_item, '{paidOutTimeUnit}', paidOut > 1 ? 'hours' : 'hour');
              }

              return _item;
            });
          }

          return EARNING_DATA_RAW[YieldPoolType.NATIVE_STAKING].map((item) => {
            const _item: BoxProps = { ...item, id: item.icon, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

            replaceEarningValue(_item, '{validatorNumber}', maxCandidatePerFarmer.toString());
            replaceEarningValue(_item, '{validatorType}', label);
            replaceEarningValue(_item, '{periodNumb}', unBondedTime);
            replaceEarningValue(_item, '{maintainBalance}', maintainBalance);
            replaceEarningValue(_item, '{maintainSymbol}', maintainSymbol);

            if (paidOut !== undefined) {
              replaceEarningValue(_item, '{paidOut}', paidOut.toString());
              replaceEarningValue(_item, '{paidOutTimeUnit}', paidOut > 1 ? 'hours' : 'hour');
            }

            return _item;
          });
        } else {
          return [];
        }
      }

      case YieldPoolType.LIQUID_STAKING: {
        const derivativeSlug = poolInfo.metadata.derivativeAssets?.[0] || '';
        const derivative = assetRegistry[derivativeSlug];
        const inputAsset = assetRegistry[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistry[poolInfo.metadata.maintainAsset];

        if (derivative && inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          return EARNING_DATA_RAW[YieldPoolType.LIQUID_STAKING].map((item) => {
            const _item: BoxProps = { ...item, id: item.icon, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

            replaceEarningValue(_item, '{derivative}', derivative.symbol);
            replaceEarningValue(_item, '{periodNumb}', unBondedTime);
            replaceEarningValue(_item, '{inputToken}', inputAsset.symbol);
            replaceEarningValue(_item, '{maintainBalance}', maintainBalance);
            replaceEarningValue(_item, '{maintainSymbol}', maintainSymbol);

            return _item;
          });
        } else {
          return [];
        }
      }

      case YieldPoolType.LENDING: {
        const derivativeSlug = poolInfo.metadata.derivativeAssets?.[0] || '';
        const derivative = assetRegistry[derivativeSlug];
        const inputAsset = assetRegistry[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistry[poolInfo.metadata.maintainAsset];

        if (derivative && inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          return EARNING_DATA_RAW[YieldPoolType.LENDING].map((item) => {
            const _item: BoxProps = { ...item, id: item.icon, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

            replaceEarningValue(_item, '{derivative}', derivative.symbol);
            replaceEarningValue(_item, '{inputToken}', inputAsset.symbol);
            replaceEarningValue(_item, '{maintainBalance}', maintainBalance);
            replaceEarningValue(_item, '{maintainSymbol}', maintainSymbol);

            return _item;
          });
        } else {
          return [];
        }
      }
    }
  }, [assetRegistry, poolInfo, replaceEarningValue, unBondedTime]);

  const onClickFaq = useCallback(() => {
    if (!poolInfo) {
      return;
    }

    let urlParam = '';

    switch (poolInfo.metadata.shortName) {
      case 'Polkadot': {
        urlParam = '#polkadot-nomination-pool';
        break;
      }

      case 'Acala': {
        urlParam = '#acala';
        break;
      }

      case 'Bifrost Polkadot': {
        urlParam = '#bifrost';

        if (poolInfo.slug === 'MANTA___liquid_staking___bifrost_dot') {
          urlParam = '#vmanta-on-bifrost';
        }

        break;
      }

      case 'Interlay': {
        urlParam = '#interlay';
        break;
      }

      case 'Moonwell': {
        urlParam = '#moonwell';
        break;
      }

      case 'Parallel': {
        urlParam = '#parallel';
        break;
      }

      case 'Stellaswap': {
        urlParam = '#stellaswap';
        break;
      }
    }

    const url = `https://docs.subwallet.app/main/web-dashboard-user-guide/earning/faqs${urlParam}`;

    open(url);
  }, [poolInfo]);

  const onClickButton = useCallback(() => {
    if (!poolInfo) {
      return;
    }

    if (bypassEarlyValidate) {
      onStakeMore?.(poolInfo.slug, poolInfo.chain);

      return;
    }

    const time = Date.now();

    checkRef.current = time;
    setLoading(true);

    const isValid = () => {
      return time === checkRef.current;
    };

    const onError = (message: string) => {
      openAlert({
        title: t('Pay attention!'),
        type: NotificationType.ERROR,
        content: message,
        okButton: {
          text: t('I understand'),
          onClick: closeAlert,
          icon: CheckCircle
        }
      });
    };

    earlyValidateJoin({
      slug: poolInfo.slug,
      address: address || ''
    })
      .then((rs) => {
        if (isValid()) {
          if (rs.passed) {
            setVisible(false);
            setTimeout(() => {
              onStakeMore?.(poolInfo.slug, poolInfo.chain);
            }, 300);
          } else {
            const message = rs.errorMessage || '';

            onError(message);
          }
        }
      })
      .catch((e) => {
        if (isValid()) {
          const message = (e as Error).message || '';

          onError(message);
        }
      })
      .finally(() => {
        if (isValid()) {
          setLoading(false);
        }
      });
  }, [address, bypassEarlyValidate, closeAlert, onStakeMore, openAlert, poolInfo, setVisible, t]);

  const onScrollContent = useCallback(() => {
    scrollRef?.current?.scroll({ top: scrollRef?.current?.scrollHeight, left: 0 });
  }, [scrollRef]);

  const onScrollToAcceptButton = useCallback(() => {
    if (!scrollRef?.current) {
      return;
    }

    setIsScrollEnd(scrollRef.current.scrollTop >= scrollRef.current.scrollHeight - 500);
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    onCancel?.();
    setIsScrollEnd(false);
  }, [onCancel, setVisible]);

  useEffect(() => {
    if (!poolInfo) {
      inactiveModal(modalId);
    }
  }, [inactiveModal, poolInfo]);

  useEffect(() => {
    if (isScrollEnd) {
      setDisableEarnButton(false);
    }
  }, [isScrollEnd]);

  if (!poolInfo) {
    return null;
  }

  const footerNode = (
    <>
      <div className='__footer-more-information-text-wrapper'>
        <div className='__footer-more-information-text'>
          <Trans
            components={{
              highlight: (
                <a
                  className='__link'
                  onClick={onClickFaq}
                  rel='noopener noreferrer'
                  target='_blank'
                />
              )
            }}
            i18nKey={detectTranslate('For more information and staking instructions, read <highlight>this FAQ</highlight>')}
          />
        </div>

        <Button
          className={'__scroll-to-end-button'}
          disabled={isScrollEnd}
          icon={<Icon phosphorIcon={CaretDown} />}
          onClick={onScrollContent}
          shape={'circle'}
          size={'xs'}
        />
      </div>

      <div className={'__buttons'}>
        { !isWebUI &&
          <Button
            block={true}
            className={'__cancel-button'}
            icon={
              <Icon
                phosphorIcon={isShowStakeMoreButton ? CaretCircleLeft : XCircle}
                weight='fill'
              />
            }
            onClick={closeModal}
            schema={'secondary'}
          >
            {isShowStakeMoreButton ? t('Back') : t('Close')}
          </Button>
        }
        {isShowStakeMoreButton && (
          <Button
            block={true}
            className={'__stake-more-button'}
            disabled={!isWebUI && isDisableEarnButton}
            icon={
              <Icon
                phosphorIcon={PlusCircle}
                weight='fill'
              />
            }
            loading={loading}
            onClick={onClickButton}
          >
            {customButtonTitle || buttonTitle}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <BaseModal
      center={true}
      className={CN(className, { '-desktop-instruction': isWebUI })}
      closable={isWebUI}
      destroyOnClose={true}
      footer={footerNode}
      fullSizeOnMobile={true}
      id={modalId}
      maskClosable={false}
      onCancel={closeModal}
      title={title}
      width={isWebUI ? 642 : undefined}
    >
      <div
        className={'__scroll-container'}
        onScroll={onScrollToAcceptButton}
        ref={scrollRef}
      >
        <div className={'__instruction-items-container'}>
          {data.map((item, index) => {
            return (
              <InstructionItem
                className={'__instruction-item'}
                description={(
                  <div dangerouslySetInnerHTML={{ __html: item.description }}></div>
                )}
                iconInstruction={
                  <BackgroundIcon
                    backgroundColor={getAlphaColor(item.iconColor, 0.1)}
                    iconColor={item.iconColor}
                    phosphorIcon={item.icon}
                    size='lg'
                    weight='fill'
                  />
                }
                key={`${item.title}-${index}`}
                title={item.title}
              />
            );
          })}
        </div>
      </div>
    </BaseModal>
  );
};

const EarningInstructionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    justifyContent: 'normal',
    '.ant-sw-modal-content': {
      maxHeight: 584,
      height: 584
    },

    '.ant-sw-modal-content.ant-sw-modal-content': {

    },

    '.ant-sw-modal-body.ant-sw-modal-body': {
      padding: 0
    },

    '.ant-sw-modal-footer': {
      borderTop: 0
    },

    '.__footer-more-information-text-wrapper': {
      justifyContent: 'space-between',
      display: 'flex',
      gap: token.size
    },

    '.__footer-more-information-text': {
      color: token.colorTextLight4,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      textAlign: 'left',

      '.__link': {
        textDecoration: 'underline',
        color: token.colorPrimary
      }
    },

    '.__instruction-item': {
      '.__item-description strong': {
        fontWeight: 'inherit',
        color: token.colorTextLight2
      }
    },

    '.__instruction-item + .__instruction-item': {
      marginTop: token.marginXS
    },

    '.__scroll-container': {
      overflow: 'auto',
      height: '100%',
      paddingLeft: token.padding,
      paddingTop: token.padding,
      paddingRight: token.padding,
      scrollBehavior: 'smooth'
    },

    '.ant-sw-sub-header-title-content': {
      'white-space': 'normal',
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.ant-sw-header-container-center .ant-sw-header-center-part': {
      position: 'relative',
      maxWidth: 445,
      marginLeft: 'auto',
      marginRight: 'auto'
    },

    '.__buttons': {
      marginTop: token.margin,
      display: 'flex',
      gap: token.sizeXXS
    },

    '&.-desktop-instruction': {
      '&:before, &:after': {
        content: '""',
        display: 'block',
        minHeight: 80,
        width: '100%',
        flex: 1
      }
    },

    '&.-desktop-instruction .ant-sw-modal-content': {
      width: '100%',
      maxHeight: 'none',
      height: 'auto',
      overflow: 'hidden',
      '.ant-sw-modal-footer': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      },
      '.__scroll-to-end-button': {
        display: 'none'
      },
      '.__buttons': {
        width: 390,
        paddingLeft: token.padding,
        paddingRight: token.padding
      }
    },
    '@media (max-height: 600px)': {
      '&.-desktop-instruction .ant-sw-modal-content': {
        maxHeight: 584,
        minHeight: 445
      }
    }

  });
});

export default EarningInstructionModal;
