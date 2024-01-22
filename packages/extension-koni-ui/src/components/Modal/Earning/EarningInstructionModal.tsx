// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolType } from '@subwallet/extension-base/types';
import { balanceFormatter, detectTranslate, formatNumber } from '@subwallet/extension-base/utils';
import InstructionItem from '@subwallet/extension-koni-ui/components/Common/InstructionItem';
import { getInputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { EARNING_DATA_RAW, EARNING_INSTRUCTION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { earlyValidateJoin } from '@subwallet/extension-koni-ui/messaging';
import { AlertDialogProps, PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getBannerButtonIcon } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, Button, Icon, Logo, ModalContext, SwModal, Tag } from '@subwallet/react-ui';
import { getAlphaColor } from '@subwallet/react-ui/lib/theme/themes/default/colorAlgorithm';
import CN from 'classnames';
import { CaretDown, PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps{
  slug: string;
  onCancel?: VoidFunction;
  onStakeMore?: (value: string) => void;
  isShowStakeMoreButton?: boolean;
  openAlert: (alertProps: AlertDialogProps) => void;
  closeAlert: VoidFunction;
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
  const { className, closeAlert, isShowStakeMoreButton = true, onCancel, onStakeMore, openAlert, slug } = props;
  const checkRef = useRef<number>(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { poolInfoMap } = useSelector((state) => state.earning);
  const { assetRegistry } = useSelector((state) => state.assetRegistry);
  const { currentAccount } = useSelector((state) => state.accountState);
  const [loading, setLoading] = useState(false);

  const poolInfo = useMemo(() => poolInfoMap[slug], [poolInfoMap, slug]);
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
      if (shortName === 'Stellaswap') {
        result = result.replace('{{shortName}}', 'StellaSwap');
      } else {
        result = result.replace('{{shortName}}', shortName);
      }
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

  const tags = useMemo(() => {
    const asset = assetRegistry[poolInfo.metadata.inputAsset];
    const symbol = asset.symbol;

    if (poolInfo.statistic && 'assetEarning' in poolInfo.statistic && poolInfo.statistic?.assetEarning) {
      const assetEarning = poolInfo.statistic?.assetEarning;
      const data = assetEarning.map((item) => {
        const result: { slug: string; apy: number; symbol: string } = { slug: item.slug, apy: 0, symbol: symbol };

        result.slug = item.slug;

        if (!item.apy) {
          const rs = calculateReward(item?.apr || 0);

          result.apy = rs.apy || 0;
        } else {
          result.apy = item.apy;
        }

        return result;
      });

      return data.filter((item) => item.apy);
    }

    return [];
  }, [assetRegistry, poolInfo.metadata.inputAsset, poolInfo.statistic]);

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
    let time: number | undefined;

    if (poolInfo.statistic && 'unstakingPeriod' in poolInfo.statistic) {
      time = poolInfo.statistic.unstakingPeriod;
    }

    return convertTime(time);
  }, [poolInfo.statistic, convertTime]);

  const data: BoxProps[] = useMemo(() => {
    if (!poolInfo) {
      return [];
    }

    switch (poolInfo.type) {
      case YieldPoolType.NOMINATION_POOL: {
        const _label = getValidatorLabel(poolInfo.chain);
        const label = _label.slice(0, 1).toLowerCase().concat(_label.slice(1)).concat('s');
        const maxCandidatePerFarmer = poolInfo.statistic?.maxCandidatePerFarmer || 0;
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
            }

            return _item;
          });
        } else {
          return [];
        }
      }

      case YieldPoolType.NATIVE_STAKING: {
        const _label = getValidatorLabel(poolInfo.chain);
        const label = _label.slice(0, 1).toLowerCase().concat(_label.slice(1)).concat('s');
        const maxCandidatePerFarmer = poolInfo.statistic?.maxCandidatePerFarmer || 0;
        const inputAsset = assetRegistry[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistry[poolInfo.metadata.maintainAsset];
        const paidOut = poolInfo.statistic?.eraTime;

        if (inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          if (poolInfo.slug === 'ASTR___native_staking___astar') {
            return EARNING_DATA_RAW.DAPP_STAKING.map((item) => {
              const _item: BoxProps = { ...item, id: item.icon, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

              replaceEarningValue(_item, '{validatorNumber}', maxCandidatePerFarmer.toString());
              replaceEarningValue(_item, '{periodNumb}', unBondedTime);
              replaceEarningValue(_item, '{maintainBalance}', maintainBalance);
              replaceEarningValue(_item, '{maintainSymbol}', maintainSymbol);

              if (paidOut !== undefined) {
                replaceEarningValue(_item, '{paidOut}', paidOut.toString());
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

      case 'Stellaswap': {
        urlParam = '#stellaswap';
        break;
      }
    }

    const url = `https://docs.subwallet.app/main/web-dashboard-user-guide/earning/faqs${urlParam}`;

    open(url);
  }, [poolInfo.metadata.shortName]);

  const onClickButton = useCallback(() => {
    const time = Date.now();

    checkRef.current = time;
    setLoading(true);

    const isValid = () => {
      return time === checkRef.current;
    };

    const onError = (message: string) => {
      openAlert({
        title: t('Pay attention!'),
        content: message,
        okButton: {
          text: t('I understand'),
          onClick: () => {
            closeAlert();
          }
        }
      });
    };

    earlyValidateJoin({
      slug: slug,
      address: currentAccount?.address || ''
    })
      .then((rs) => {
        if (isValid()) {
          if (rs.passed) {
            setVisible(false);
            setTimeout(() => {
              onStakeMore?.(slug);
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
  }, [closeAlert, currentAccount?.address, onStakeMore, openAlert, setVisible, slug, t]);

  const onScrollContent = useCallback(() => {
    scrollRef?.current?.scroll({ top: scrollRef?.current?.scrollHeight, left: 0 });
  }, [scrollRef]);

  const onScrollToAcceptButton = useCallback(() => {
    //
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    onCancel?.();
  }, [onCancel, setVisible]);

  useEffect(() => {
    if (!poolInfo) {
      inactiveModal(modalId);
    }
  }, [inactiveModal, poolInfo]);

  const footerNode = (
    <>
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
          i18nKey={detectTranslate('Scroll down to continue. For more information and staking instructions, read <highlight>this FAQ</highlight>')}
        />
      </div>
      {isShowStakeMoreButton && (
        <Button
          block={true}
          className={'__stake-more-button'}
          icon={
            <Icon
              phosphorIcon={PlusCircle}
              weight='fill'
            />
          }
          loading={loading}
          onClick={onClickButton}
        >
          {buttonTitle}
        </Button>
      )}
    </>
  );

  if (!poolInfo) {
    return null;
  }

  return (
    <SwModal
      className={CN(className)}
      footer={footerNode}
      id={modalId}
      onCancel={closeModal}
      title={t('Instruction')}
    >
      <div
        className={'__scroll-container'}
        onScroll={onScrollToAcceptButton}
        ref={scrollRef}
      >
        <div className={'__main-title-area'}>
          <div className={'__main-title'}>{title}</div>

          {!!(tags && tags.length) && (
            <div
              className={'__tags-container'}
            >
              {tags.map(({ apy, slug: tagSlug, symbol }) => (
                <Tag
                  bgType={'gray'}
                  className={'__tag-item'}
                  icon={(
                    <Logo
                      size={16}
                      token={tagSlug.toLowerCase()}
                    />
                  )}
                  key={tagSlug}
                  shape={'round'}
                >
                  {`${formatNumber(apy, 0, balanceFormatter)}% ${symbol}`}
                </Tag>
              ))}
            </div>
          )}
        </div>

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

      <div className={'__scroll-to-end-button-wrapper hidden'}>
        <Button
          className={'__scroll-to-end-button'}
          icon={<Icon phosphorIcon={CaretDown} />}
          onClick={onScrollContent}
          shape={'circle'}
          size={'xs'}
        />
      </div>
    </SwModal>
  );
};

const EarningInstructionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    height: '100%',

    '.ant-sw-modal-content.ant-sw-modal-content': {
      maxHeight: 'none',
      height: '100%',
      borderRadius: 0
    },

    '.ant-sw-modal-body.ant-sw-modal-body': {
      padding: 0
    },

    '.ant-sw-modal-footer': {
      borderTop: 0
    },

    '.__main-title': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight,
      textAlign: 'center'
    },

    '.__footer-more-information-text': {
      color: token.colorTextLight4,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      textAlign: 'center',

      '.__link': {
        textDecoration: 'underline',
        color: token.colorPrimary
      }
    },

    '.__stake-more-button': {
      marginTop: token.margin
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
      paddingRight: token.padding
    },

    '.__main-title-area': {
      marginBottom: token.margin
    },

    '.__tags-container': {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: token.sizeXS,
      marginTop: token.marginXS,

      '.ant-image-img, .ant-logo, .ant-image': {
        display: 'block'
      }
    },

    '.__tag-item': {
      display: 'inline-flex',
      alignItems: 'center',
      marginRight: 0,
      gap: token.sizeXXS,
      color: token.colorSecondary
    },

    '.__scroll-to-end-button-wrapper': {
      position: 'relative'
    },

    '.__scroll-to-end-button': {
      position: 'absolute',
      bottom: token.sizeXXS,
      right: token.size
    }
  });
});

export default EarningInstructionModal;
