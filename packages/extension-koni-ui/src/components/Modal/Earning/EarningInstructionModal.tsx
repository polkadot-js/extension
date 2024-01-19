
// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { _ChainAsset } from '@subwallet/chain-list/types';
import { getValidatorLabel } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import {balanceFormatter, detectTranslate, formatNumber} from '@subwallet/extension-base/utils';
import ContentBoxIcon from '@subwallet/extension-koni-ui/components/Common/ContentBoxIcon';
import InstructionItem from '@subwallet/extension-koni-ui/components/Common/InstructionItem';
import { getInputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import {EARNING_DATA_RAW, EARNING_INSTRUCTION_MODAL} from '@subwallet/extension-koni-ui/constants';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import {getBannerButtonIcon} from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, ModalContext, SwIconProps, SwModal, Tag } from '@subwallet/react-ui';
import { getAlphaColor } from '@subwallet/react-ui/lib/theme/themes/default/colorAlgorithm';
import CN from 'classnames';
import { CaretDown, Coins, PlusCircle, X } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {Trans} from "react-i18next";

interface Props extends ThemeProps{
  slug: string;
  onCancel?: () => void;
  onStakeMore?: (value: string) => void;
  isShowStakeMoreBtn?: boolean;
  onPressBack?: () => void;
}

export interface BoxProps {
  title: string;
  description: React.ReactNode;
  iconColor: string;
  icon: PhosphorIcon;
}
export type SWModalRefProps = {
  scrollTo: (destination: number) => void;
  isActive: () => boolean;
  close: () => void;
};

const modalId = EARNING_INSTRUCTION_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { className, isShowStakeMoreBtn = true, onCancel, onPressBack, onStakeMore, slug } = props;
  const checkRef = useRef<number>(Date.now());

  const { poolInfoMap } = useSelector((state: RootState) => state.earning);
  const { assetRegistry } = useSelector((state: RootState) => state.assetRegistry);
  const [scrollHeight, setScrollHeight] = useState<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const poolInfoMapRef = useRef<Record<string, YieldPoolInfo>>(poolInfoMap);
  const assetRegistryRef = useRef<Record<string, _ChainAsset>>(assetRegistry);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollEnd, setShowScrollEnd] = useState(false);
  const [isScrollEnd, setIsScrollEnd] = useState(false);
  const { inactiveModal } = useContext(ModalContext);

  useEffect(() => {
    poolInfoMapRef.current = poolInfoMap;
    assetRegistryRef.current = assetRegistry;
  }, [assetRegistry, poolInfoMap]);

  const poolInfo = useMemo(() => poolInfoMapRef.current[slug], [slug]);
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
    const asset = assetRegistryRef.current[inputAsset];
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
  }, [poolInfo]);
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
    const asset = assetRegistryRef.current[poolInfo.metadata.inputAsset];
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
  }, [poolInfo.metadata.inputAsset, poolInfo.statistic]);

  const replaceEarningValue = useCallback((target: BoxProps, searchString: string, replaceValue: string) => {
    if (target.title.includes(searchString)) {
      target.title = target.title.replace(searchString, replaceValue);
    }

    if (typeof target.description === 'string' && target.description?.includes(searchString)) {
      // @ts-ignore
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
        const inputAsset = assetRegistryRef.current[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistryRef.current[poolInfo.metadata.maintainAsset];
        const paidOut = poolInfo.statistic?.eraTime;

        if (inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          return EARNING_DATA_RAW[YieldPoolType.NOMINATION_POOL].map((item) => {
            const _item: BoxProps = { ...item, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

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
        const inputAsset = assetRegistryRef.current[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistryRef.current[poolInfo.metadata.maintainAsset];
        const paidOut = poolInfo.statistic?.eraTime;

        if (inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          if (poolInfo.slug === 'ASTR___native_staking___astar') {
            return EARNING_DATA_RAW.DAPP_STAKING.map((item) => {
              const _item: BoxProps = { ...item, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

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
            const _item: BoxProps = { ...item, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

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
        const derivative = assetRegistryRef.current[derivativeSlug];
        const inputAsset = assetRegistryRef.current[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistryRef.current[poolInfo.metadata.maintainAsset];

        if (derivative && inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          return EARNING_DATA_RAW[YieldPoolType.LIQUID_STAKING].map((item) => {
            const _item: BoxProps = { ...item, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

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
        const derivative = assetRegistryRef.current[derivativeSlug];
        const inputAsset = assetRegistryRef.current[poolInfo.metadata.inputAsset];
        const maintainAsset = assetRegistryRef.current[poolInfo.metadata.maintainAsset];

        if (derivative && inputAsset && maintainAsset) {
          const { decimals: maintainDecimals, symbol: maintainSymbol } = maintainAsset;
          const maintainBalance = getInputValuesFromString(
            poolInfo.metadata.maintainBalance || '0',
            maintainDecimals || 0
          );

          return EARNING_DATA_RAW[YieldPoolType.LENDING].map((item) => {
            const _item: BoxProps = { ...item, icon: getBannerButtonIcon(item.icon) as PhosphorIcon };

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
  }, [poolInfo, replaceEarningValue, unBondedTime]);

  useEffect(() => {
    setShowScrollEnd(contentHeight > scrollHeight);
    setIsScrollEnd(contentHeight < scrollHeight);
  }, [contentHeight, scrollHeight]);

  // const isCloseToBottom = useCallback(({ contentOffset, contentSize, layoutMeasurement }: NativeScrollEvent) => {
  //   const paddingToBottom = 20;
  //
  //   return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  // }, []);

  // const onScroll = useCallback(
  //   ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
  //     if (isCloseToBottom(nativeEvent)) {
  //       setIsScrollEnd(true);
  //     }
  //   },
  //   [isCloseToBottom]
  // );

  const onClickFaq = useCallback(() => {
    console.log('dung nguyen');
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

  const onPress = useCallback(() => {
    alert('Say hello !!!');
  }, []);

  // const onError = (message: string) => {
  //   Alert.alert('Pay attention!', message, [
  //     {
  //       text: 'I understand'
  //     }
  //   ]);
  // };

  //   earlyValidateJoin({
  //     slug: slug,
  //     address: currentAccount?.address || ''
  //   })
  //     .then((rs) => {
  //       if (isValid()) {
  //         if (rs.passed) {
  //           setVisible(false);
  //           setTimeout(() => {
  //             onStakeMore?.(slug);
  //           }, 300);
  //         } else {
  //           const message = rs.errorMessage || '';
  //
  //           onError(message);
  //         }
  //       }
  //     })
  //     .catch((e) => {
  //       if (isValid()) {
  //         const message = (e as Error).message || '';
  //
  //         onError(message);
  //       }
  //     })
  //     .finally(() => {
  //       if (isValid()) {
  //         setLoading(false);
  //       }
  //     });
  // }, [currentAccount?.address, onStakeMore, setVisible, slug]);

  // const scrollBottom = useCallback(() => {
  //   scrollRef?.current?.scrollToEnd();
  // }, []);

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
    inactiveModal(modalId);
    setIsScrollEnd(false);
    setShowScrollEnd(false);
  }, [inactiveModal]);

  const goBack = useCallback(() => {
    inactiveModal(modalId);
    setIsScrollEnd(false);
    !!onPressBack && onPressBack();
  }, [inactiveModal, onPressBack]);

  useEffect(() => {
    if (!poolInfo) {
      inactiveModal(modalId);
    }
  }, [inactiveModal, poolInfo]);

  if (!poolInfo) {
    return null;
  }

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      onCancel={goBack}
      title={' '}
    >
      <div
        className={'earning-instruction'}
        onScroll={onScrollToAcceptButton}
        ref={scrollRef}
      >
        <div className={'earning-header'}>
          <div className={'earning-header-title'}>{title}</div>
            <div className={'earning-instruction-tag'}>
              {!!(tags && tags.length) && (
                <div style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center'}}>
                  {tags.map(({ apy, slug: tagSlug, symbol}) => (
                    <Tag
                      bgType={'gray'}
                      // icon={getTokenLogo(tagSlug, undefined, 16)}
                      icon={(
                        <Icon
                          phosphorIcon={Coins}
                          weight={'fill'}
                        />
                      )}
                      key={tagSlug}
                      shape={'round'}
                    >
                      <div>
                        {`${formatNumber(apy, 0, balanceFormatter)}% ${symbol}`}
                      </div>
                    </Tag>
                  ))}
                </div>
              )}
            </div>
            <div className={'earning-body-static-data'}>
              {!isScrollEnd && <Button
                className={'earning-body-caret-button'}
                icon={<Icon phosphorIcon={CaretDown} />}
                onClick={onScrollContent}
                schema={'secondary'}
                shape={'circle'}
                size={'xs'}
              />}
            {data.map((item, index) => {
              const myIconProps: SwIconProps = {
                type: 'phosphor',
                phosphorIcon: item.icon,
                iconColor: item.iconColor
              };

              return (
                <div className={'item-earning-row'} key={`${item.title}-${index}`}>
                  <InstructionItem
                    key={`${item.title}-${index}`}
                    description={item.description}
                    iconInstruction={
                      <ContentBoxIcon
                        backgroundColor={getAlphaColor(item.iconColor, 0.1)}
                        iconProps={myIconProps}
                      />
                    }
                    title={item.title}
                  />
                </div>
              );
            })}
              </div>
          </div>
          <div className={'earning-footer'}>
          <div className='instruction'>
            <Trans
              components={{
                highlight: (
                  <a
                    className='link'
                    rel='noopener noreferrer'
                    target='_blank'
                    onClick={onClickFaq}
                  />
                )
              }}
              i18nKey={detectTranslate('Scroll down to continue. For more information and staking instructions, read <highlight>this FAQ</highlight>')}
            />
          </div>
          {isShowStakeMoreBtn && (
            <Button
              disabled={!isScrollEnd && showScrollEnd}
              icon={
                <Icon
                  iconColor={isScrollEnd || !showScrollEnd ? '#fff' : 'rgba(255, 255, 255, 0.3)'}
                  phosphorIcon={PlusCircle}
                  weight='fill'
                />
              }
              loading={loading}
              onClick={onPress}
              size='sm'
            >
              {buttonTitle}
            </Button>
          )}
          </div>
      </div>
    </SwModal>
  );
};

const EarningInstructionModal = styled(Component)<Props>(({theme: {token}}: Props) => {
  return ({
    display: 'flex',
    justifyContent: 'center',
    '.item-earning-row': {
      marginBottom: 8
    },
    '.earning-header': {
    },
    '.earning-header-title': {
      fontSize: 20,
      lineHeight: token.lineHeightHeading4,
      textAlign: 'center'
    },
    '.earning-body-caret-button': {
      position: 'absolute',
      top: '60%',
      right: '5%'
    },
    '.earning-footer': {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      marginTop: token.marginXS,
      gap: token.margin
    },
    '.earning-instruction-tag': {
      display: 'flex',
      justifyContent: 'center'
    }
  });
});

export default EarningInstructionModal;
