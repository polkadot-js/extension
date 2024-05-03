// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { SpecialYieldPositionInfo, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { Avatar, CollapsiblePanel, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { InfoItemBase } from '@subwallet/extension-koni-ui/components/MetaInfo/parts';
import { EarningNominationModal } from '@subwallet/extension-koni-ui/components/Modal/Earning';
import { EARNING_NOMINATION_MODAL, EarningStatusUi } from '@subwallet/extension-koni-ui/constants';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { EarningTagType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { createEarningTypeTags, findAccountByAddress, isAccountAll, toShort } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowSquareOut, CaretLeft, CaretRight } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import Slider, { CustomArrowProps, Settings } from 'react-slick';
import styled from 'styled-components';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  list: YieldPositionInfo[];
  inputAsset: _ChainAsset;
  poolInfo: YieldPoolInfo;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NextArrow = ({ currentSlide, slideCount, ...props }: CustomArrowProps) => (
  <div {...props}>
    <div className={'__right-arrow'}>
      <div className={'__circle-icon'}>
        <Icon
          customSize={'20px'}
          phosphorIcon={CaretRight}
        />
      </div>
    </div>
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PrevArrow = ({ currentSlide, slideCount, ...props }: CustomArrowProps) => (
  <div {...props}>
    <div className={'__left-arrow'}>
      <div className={'__circle-icon'}>
        <Icon
          customSize={'20px'}
          phosphorIcon={CaretLeft}
        />
      </div>
    </div>
  </div>
);

function Component ({ className, compound, inputAsset, list, poolInfo }: Props) {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { type } = compound;

  const { assetRegistry } = useSelector((state) => state.assetRegistry);
  const { accounts } = useSelector((state) => state.accountState);

  const sliderSettings: Settings = useMemo(() => {
    return {
      dots: false,
      infinite: false,
      speed: 500,
      centerPadding: '22px',
      centerMode: true,
      slidesToShow: 1,
      nextArrow: <NextArrow />,
      prevArrow: <PrevArrow />
    };
  }, []);

  const deriveAsset = useMemo(() => {
    if ('derivativeToken' in compound) {
      const position = compound as SpecialYieldPositionInfo;

      return assetRegistry[position.derivativeToken];
    } else {
      return undefined;
    }
  }, [assetRegistry, compound]);

  const earningTagType: EarningTagType = useMemo(() => {
    return createEarningTypeTags(compound.chain)[compound.type];
  }, [compound.chain, compound.type]);

  const isAllAccount = useMemo(() => isAccountAll(compound.address), [compound.address]);
  const isSpecial = useMemo(() => [YieldPoolType.LENDING, YieldPoolType.LIQUID_STAKING].includes(type), [type]);
  const haveNomination = useMemo(() => {
    return [YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(poolInfo.type);
  }, [poolInfo.type]);
  const noNomination = useMemo(
    () => !haveNomination || isAllAccount || !compound.nominations.length,
    [compound.nominations.length, haveNomination, isAllAccount]
  );

  const [selectedAddress, setSelectedAddress] = useState('');

  const selectedItem = useMemo((): YieldPositionInfo | undefined => {
    return list.find((item) => isSameAddress(item.address, selectedAddress));
  }, [list, selectedAddress]);

  const renderAccount = useCallback(
    (item: YieldPositionInfo) => {
      const account = findAccountByAddress(accounts, item.address);

      return (
        <>
          <Avatar
            size={24}
            value={item.address}
          />
          <div className={'__account-name'}>
            {account?.name || toShort(item.address)}
          </div>
        </>
      );
    },
    [accounts]
  );

  const onCloseNominationModal = useCallback(() => {
    inactiveModal(EARNING_NOMINATION_MODAL);
  }, [inactiveModal]);

  const createOpenNomination = useCallback((item: YieldPositionInfo) => {
    return () => {
      setSelectedAddress(item.address);
      activeModal(EARNING_NOMINATION_MODAL);
    };
  }, [activeModal]);

  const accountInfoItemsNode = useMemo(() => {
    return list.map((item) => {
      const disableButton = !item.nominations.length;

      return (
        <MetaInfo
          className={CN('__account-info-item', {
            '-box-mode': isAllAccount
          })}
          hasBackgroundWrapper={isAllAccount}
          key={item.address}
          labelColorScheme='gray'
          labelFontWeight='regular'
          spaceSize='sm'
          valueColorScheme='light'
        >
          {!isAllAccount
            ? (
              <MetaInfo.Account
                address={item.address}
                label={t('Account')}
              />
            )
            : (
              <MetaInfo.Status
                className={'__meta-earning-status-item'}
                label={renderAccount(item)}
                statusIcon={EarningStatusUi[item.status].icon}
                statusName={EarningStatusUi[item.status].name}
                valueColorSchema={EarningStatusUi[item.status].schema}
              />
            )}

          <MetaInfo.Default
            label={t('Staking type')}
            valueColorSchema={earningTagType.color as InfoItemBase['valueColorSchema']}
          >
            {earningTagType.label}
          </MetaInfo.Default>

          {!isSpecial
            ? (
              <>
                <MetaInfo.Number
                  decimals={inputAsset?.decimals || 0}
                  label={t('Total stake')}
                  suffix={inputAsset?.symbol}
                  value={new BigN(item.totalStake)}
                  valueColorSchema='even-odd'
                />
                <MetaInfo.Number
                  decimals={inputAsset?.decimals || 0}
                  label={t('Active stake')}
                  suffix={inputAsset?.symbol}
                  value={item.activeStake}
                  valueColorSchema='even-odd'
                />
                <MetaInfo.Number
                  decimals={inputAsset?.decimals || 0}
                  label={t('Unstaked')}
                  suffix={inputAsset?.symbol}
                  value={item.unstakeBalance}
                  valueColorSchema='even-odd'
                />
              </>
            )
            : (
              <>
                <MetaInfo.Number
                  decimals={inputAsset?.decimals || 0}
                  label={t('Total stake')}
                  suffix={inputAsset?.symbol}
                  value={new BigN(item.totalStake)}
                  valueColorSchema='even-odd'
                />
                <MetaInfo.Number
                  decimals={deriveAsset?.decimals || 0}
                  label={t('Derivative token balance')}
                  suffix={deriveAsset?.symbol}
                  value={item.activeStake}
                  valueColorSchema='even-odd'
                />
              </>
            )}
          {isAllAccount && haveNomination && (
            <>
              <div className='__separator'></div>

              <div className={'__nomination-button-wrapper'}>
                <Button
                  block={true}
                  className={'__nomination-button'}
                  disabled={disableButton}
                  onClick={createOpenNomination(item)}
                  size={'xs'}
                  type={'ghost'}
                >
                  <div className={'__nomination-button-label'}>
                    {t('Nomination info')}
                  </div>

                  <Icon
                    phosphorIcon={ArrowSquareOut}
                    size={'sm'}
                  />
                </Button>
              </div>
            </>
          )}
        </MetaInfo>
      );
    });
  }, [createOpenNomination, deriveAsset?.decimals, deriveAsset?.symbol, earningTagType.color, earningTagType.label, haveNomination, inputAsset?.decimals, inputAsset?.symbol, isAllAccount, isSpecial, list, renderAccount, t]);

  return (
    <>
      <CollapsiblePanel
        className={CN(className, {
          '-no-nomination': noNomination,
          '-horizontal-mode': isAllAccount,
          '-has-one-item': list.length === 1
        })}
        title={t('Account info')}
      >

        {isAllAccount
          ? (
            <div className={'__slider-container'}>
              <Slider
                className={'__carousel-container'}
                {...sliderSettings}
              >
                {accountInfoItemsNode}
              </Slider>
            </div>
          )
          : (
            accountInfoItemsNode
          )}

      </CollapsiblePanel>

      <EarningNominationModal
        inputAsset={inputAsset}
        item={selectedItem}
        onCancel={onCloseNominationModal}
      />
    </>
  );
}

export const AccountInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '&.-horizontal-mode': {
    '.__panel-body': {
      overflowX: 'auto',
      display: 'flex',
      gap: token.sizeSM
    }
  },

  '&.-horizontal-mode:not(.-has-one-item)': {
    '.__panel-body': {
      paddingLeft: 0,
      paddingRight: 0
    }
  },

  '&.-horizontal-mode.-has-one-item': {
    '.__account-info-item.-box-mode': {
      minWidth: 300
    }
  },

  '.__slider-container': {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },

  '.__circle-icon': {
    width: 40,
    height: 40,
    backgroundColor: token['gray-2'],
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  '.slick-slide > div': {
    paddingLeft: 6,
    paddingRight: 6
  },

  '.__carousel-container': {
    '.slick-prev, .slick-next': {
      width: 40,
      position: 'absolute',
      top: 0,
      bottom: 0,
      cursor: 'pointer',
      zIndex: 20
    },

    '.slick-prev': {
      left: 0
    },

    '.slick-next': {
      right: token.size
    },

    '.slick-disabled .__right-arrow': {
      display: 'none'
    },

    '.slick-disabled .__left-arrow': {
      display: 'none'
    },

    '.__left-arrow, .__right-arrow': {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  },

  '.__separator': {
    height: 2,
    backgroundColor: 'rgba(33, 33, 33, 0.80)'
  },

  '.meta-info-block + .meta-info-block': {
    marginTop: 0
  },

  '.__account-info-item': {
    '.__separator': {
      marginTop: token.marginSM
    }
  },

  '.__account-info-item.-box-mode': {
    backgroundColor: token.colorBgDefault
  },

  '.__meta-earning-status-item': {
    '.__label': {
      'white-space': 'nowrap',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.sizeXS,
      overflow: 'hidden'
    },

    '.__value-col': {
      flex: '0 1 auto'
    },

    '.__account-name': {
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    }
  },

  '.__nomination-button-wrapper': {
    marginLeft: -token.marginSM,
    marginRight: -token.marginSM
  },

  '.__nomination-button': {
    paddingLeft: token.paddingSM,
    paddingRight: token.paddingSM,
    justifyContent: 'space-between',
    gap: token.sizeSM
  },

  '.__nomination-button-label': {
    color: token.colorTextLight4
  },

  '.__nomination-button:hover': {
    '.__nomination-button-label': {
      color: 'inherit'
    }
  }
}));
