// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { AlertModal, EmptyList, FilterModal, Layout } from '@subwallet/extension-koni-ui/components';
import { EarningPositionItem } from '@subwallet/extension-koni-ui/components/Earning';
import { ASTAR_PORTAL_URL, BN_TEN, EARNING_WARNING_ANNOUNCEMENT } from '@subwallet/extension-koni-ui/constants';
import { useAlert, useFilterModal, useGetYieldPositionForSpecificAccount, useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { reloadCron } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { EarningEntryView, EarningPositionDetailParam, ExtraYieldPositionInfo, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isRelatedToAstar, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, ButtonProps, Icon, ModalContext, SwList } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowsClockwise, FadersHorizontal, Plus, PlusCircle, Vault } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  earningPositions: YieldPositionInfo[];
  setEntryView: React.Dispatch<React.SetStateAction<EarningEntryView>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

let cacheData: Record<string, boolean> = {};
const FILTER_MODAL_ID = 'earning-positions-filter-modal';
const alertModalId = 'earning-positions-alert-modal';

function Component ({ className, earningPositions, setEntryView, setLoading }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { activeModal } = useContext(ModalContext);

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const { currencyData, priceMap } = useSelector((state) => state.price);
  const { assetRegistry: assetInfoMap } = useSelector((state) => state.assetRegistry);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);
  const accounts = useSelector((root: RootState) => root.accountState.accounts);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);
  const specificList = useGetYieldPositionForSpecificAccount(currentAccount?.address);
  const [announcement, setAnnouncement] = useLocalStorage(EARNING_WARNING_ANNOUNCEMENT, 'nonConfirmed');

  const items: ExtraYieldPositionInfo[] = useMemo(() => {
    if (!earningPositions.length) {
      return [];
    }

    return earningPositions
      .map((item): ExtraYieldPositionInfo => {
        const priceToken = assetInfoMap[item.balanceToken];
        const price = priceMap[priceToken?.priceId || ''] || 0;

        return {
          ...item,
          asset: priceToken,
          price,
          currency: currencyData
        };
      })
      .sort((firstItem, secondItem) => {
        const getValue = (item: ExtraYieldPositionInfo): number => {
          return new BigN(item.totalStake)
            .dividedBy(BN_TEN.pow(item.asset.decimals || 0))
            .multipliedBy(item.price)
            .toNumber();
        };

        return getValue(secondItem) - getValue(firstItem);
      });
  }, [assetInfoMap, currencyData, earningPositions, priceMap]);

  const chainStakingBoth = useMemo(() => {
    const chains = ['polkadot', 'kusama'];

    const findChainWithStaking = (list: YieldPositionInfo[]) => {
      const hasNativeStaking = (chain: string) => list.some((item) => item.chain === chain && item.type === YieldPoolType.NATIVE_STAKING);
      const hasNominationPool = (chain: string) => list.some((item) => item.chain === chain && item.type === YieldPoolType.NOMINATION_POOL);

      for (const chain of chains) {
        if (hasNativeStaking(chain) && hasNominationPool(chain)) {
          return chain;
        }
      }

      return null;
    };

    if (currentAccount?.address !== ALL_ACCOUNT_KEY) {
      return findChainWithStaking(specificList);
    }

    for (const acc of accounts) {
      if (acc.address !== ALL_ACCOUNT_KEY) {
        const listStaking = specificList.filter((item) => item.address === acc.address);
        const chain = findChainWithStaking(listStaking);

        if (chain) {
          return chain;
        }
      }
    }

    return null;
  }, [accounts, currentAccount?.address, specificList]);

  const learnMore = useCallback(() => {
    window.open('https://support.polkadot.network/support/solutions/articles/65000188140-changes-for-nomination-pool-members-and-opengov-participation');
  }, []);

  const onCancel = useCallback(() => {
    closeAlert();
    setAnnouncement('confirmed');
  }, [closeAlert, setAnnouncement]);

  useEffect(() => {
    if (chainStakingBoth && announcement.includes('nonConfirmed')) {
      const chainInfo = chainStakingBoth && chainInfoMap[chainStakingBoth];

      const symbol = (!!chainInfo && chainInfo?.substrateInfo?.symbol) || '';
      const originChain = (!!chainInfo && chainInfo?.name) || '';

      openAlert({
        type: NotificationType.WARNING,
        onCancel: onCancel,
        content:
          (<>
            <div className={CN(className, 'earning-alert-content')}>
              <span>{t('You’re dual staking via both direct nomination and nomination pool, which')}&nbsp;</span>
              <span className={'__info-highlight'}>{t('will not be supported')}&nbsp;</span>
              <span>{t(`in the upcoming ${originChain} runtime upgrade. Read more to learn about the upgrade, and`)}&nbsp;</span>
              <a
                href={'https://docs.subwallet.app/main/mobile-app-user-guide/manage-staking/unstake'}
                rel='noreferrer'
                style={{ textDecoration: 'underline' }}
                target={'_blank'}
              >{(`unstake your ${symbol}`)}
              </a>&nbsp;
              <span>{t('from one of the methods to avoid issues')}</span>
            </div>

          </>),
        title: t(`Unstake your ${symbol} now!`),
        okButton: {
          text: t('Read update'),
          onClick: () => {
            learnMore();
            setAnnouncement('confirmed');
            closeAlert();
          }
        },
        cancelButton: {
          text: t('Dismiss'),
          onClick: () => {
            closeAlert();
            setAnnouncement('confirmed');
          }
        }
      });
    }
  }, [announcement, chainInfoMap, chainStakingBoth, className, closeAlert, learnMore, onCancel, openAlert, setAnnouncement, t]);

  const lastItem = useMemo(() => {
    return items[items.length - 1];
  }, [items]);

  const filterOptions = [
    { label: t('Nomination pool'), value: YieldPoolType.NOMINATION_POOL },
    { label: t('Direct nomination'), value: YieldPoolType.NATIVE_STAKING },
    { label: t('Liquid staking'), value: YieldPoolType.LIQUID_STAKING },
    { label: t('Lending'), value: YieldPoolType.LENDING },
    { label: t('Parachain staking'), value: YieldPoolType.PARACHAIN_STAKING },
    { label: t('Single farming'), value: YieldPoolType.SINGLE_FARMING }
  ];

  const filterFunction = useMemo<(items: ExtraYieldPositionInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === '') {
          return true;
        }

        if (filter === YieldPoolType.NOMINATION_POOL && item.type === YieldPoolType.NOMINATION_POOL) {
          return true;
        } else if (filter === YieldPoolType.NATIVE_STAKING && item.type === YieldPoolType.NATIVE_STAKING) {
          return true;
        } else if (filter === YieldPoolType.LIQUID_STAKING && item.type === YieldPoolType.LIQUID_STAKING) {
          return true;
        } else if (filter === YieldPoolType.LENDING && item.type === YieldPoolType.LENDING) {
          return true;
        }
        // Uncomment the following code block if needed
        // else if (filter === YieldPoolType.PARACHAIN_STAKING && item.type === YieldPoolType.PARACHAIN_STAKING) {
        //   return true;
        // } else if (filter === YieldPoolType.SINGLE_FARMING && item.type === YieldPoolType.SINGLE_FARMING) {
        //   return true;
        // }
      }

      return false;
    };
  }, [selectedFilters]);

  const onClickItem = useCallback((item: ExtraYieldPositionInfo) => {
    return () => {
      if (isRelatedToAstar(item.slug)) {
        openAlert({
          title: t('Enter Astar portal'),
          content: t('Navigate to Astar portal to view and manage your stake in Astar dApp staking v3'),
          cancelButton: {
            text: t('Cancel'),
            schema: 'secondary',
            onClick: closeAlert
          },
          okButton: {
            text: t('Enter Astar portal'),
            onClick: () => {
              openInNewTab(ASTAR_PORTAL_URL)();
              closeAlert();
            }
          }
        });
      } else {
        navigate('/home/earning/position-detail', { state: {
          earningSlug: item.slug
        } as EarningPositionDetailParam });
      }
    };
  }, [closeAlert, navigate, openAlert, t]);
  const onClickExploreEarning = useCallback(() => {
    setEntryView(EarningEntryView.OPTIONS);
  }, [setEntryView]);

  const renderItem = useCallback(
    (item: ExtraYieldPositionInfo) => {
      return (
        <>
          <EarningPositionItem
            className={'earning-position-item'}
            isShowBalance={isShowBalance}
            key={item.slug}
            onClick={onClickItem(item)}
            positionInfo={item}
          />
          {item.slug === lastItem.slug && <div className={'__footer-button'}>
            <Button
              icon={(
                <Icon
                  phosphorIcon={Plus}
                  size='sm'
                />
              )}
              onClick={onClickExploreEarning}
              size={'xs'}
              type={'ghost'}
            >
              {t('Explore earning options')}
            </Button>
          </div>}
        </>
      );
    },
    [lastItem.slug, isShowBalance, onClickItem, onClickExploreEarning, t]
  );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        buttonProps={{
          icon: (
            <Icon
              phosphorIcon={PlusCircle}
              weight={'fill'}
            />),
          onClick: () => {
            setEntryView(EarningEntryView.OPTIONS);
          },
          size: 'xs',
          shape: 'circle',
          children: t('Explore earning options')
        }}
        emptyMessage={t('Change your search or explore other earning options')}
        emptyTitle={t('No earning position found')}
        phosphorIcon={Vault}
      />
    );
  }, [setEntryView, t]);

  const searchFunction = useCallback(({ balanceToken, chain: _chain }: ExtraYieldPositionInfo, searchText: string) => {
    const chainInfo = chainInfoMap[_chain];
    const assetInfo = assetInfoMap[balanceToken];

    return (
      chainInfo?.name.replace(' Relay Chain', '').toLowerCase().includes(searchText.toLowerCase()) ||
      assetInfo?.symbol.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [assetInfoMap, chainInfoMap]);

  const subHeaderButtons: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: (
          <Icon
            phosphorIcon={ArrowsClockwise}
            size='sm'
            type='phosphor'
          />
        ),
        onClick: () => {
          setLoading(true);
          reloadCron({ data: 'staking' })
            .catch(console.error).finally(() => {
              setTimeout(() => {
                setLoading(false);
              }, 1000);
            });
        }
      },
      {
        icon: (
          <Icon
            phosphorIcon={Plus}
            size='sm'
            type='phosphor'
          />
        ),
        onClick: () => {
          setEntryView(EarningEntryView.OPTIONS);
        }
      }
    ];
  }, [setEntryView, setLoading]);

  useEffect(() => {
    const address = currentAccount?.address || '';

    if (cacheData[address] === undefined) {
      cacheData = { [address]: !items.length };
    }
  }, [items.length, currentAccount]);

  const onClickFilterButton = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  return (
    <>
      <Layout.Base
        className={CN(className)}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButtons}
        subHeaderPaddingVertical={true}
        title={t<string>('Your earning positions')}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          className={'__section-list-container'}
          enableSearchInput
          filterBy={filterFunction}
          list={items}
          onClickActionBtn={onClickFilterButton}
          renderItem={renderItem}
          renderWhenEmpty={emptyList}
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search token')}
          showActionBtn
        />
        <FilterModal
          applyFilterButtonTitle={t('Apply filter')}
          id={FILTER_MODAL_ID}
          onApplyFilter={onApplyFilter}
          onCancel={onCloseFilterModal}
          onChangeOption={onChangeFilterOption}
          optionSelectionMap={filterSelectionMap}
          options={filterOptions}
          title={t('Filter')}
        />
      </Layout.Base>

      {
        !!alertProps && (
          <AlertModal
            modalId={alertModalId}
            {...alertProps}
          />
        )
      }
    </>
  );
}

const EarningPositions = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.ant-sw-sub-header-container': {
    marginBottom: token.marginXS
  },

  '.__section-list-container': {
    height: '100%',
    flex: 1
  },

  '&.earning-alert-content': {
    '.__info-highlight': {
      fontWeight: token.fontWeightStrong
    }
  },

  '.__footer-button': {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: token.size,
    marginTop: token.marginXS
  },

  '.earning-position-item': {
    '+ .earning-position-item': {
      marginTop: token.marginXS
    }
  }
}));

export default EarningPositions;
