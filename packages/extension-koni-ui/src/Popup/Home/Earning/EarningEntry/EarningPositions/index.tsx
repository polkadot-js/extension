// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPositionInfo } from '@subwallet/extension-base/types';
import { EmptyList, Layout } from '@subwallet/extension-koni-ui/components';
import { EarningPositionItem } from '@subwallet/extension-koni-ui/components/Earning';
import { BN_TEN } from '@subwallet/extension-koni-ui/constants';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { EarningEntryView, EarningPositionDetailParam, ExtraYieldPositionInfo, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Icon, SwList } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { Database, Plus } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps & {
  earningPositions: YieldPositionInfo[];
  setEntryView: React.Dispatch<React.SetStateAction<EarningEntryView>>;
}

let cacheData: Record<string, boolean> = {};

function Component ({ className, earningPositions, setEntryView }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const priceMap = useSelector((state) => state.price.priceMap);
  const { assetRegistry: assetInfoMap } = useSelector((state) => state.assetRegistry);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);

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
          price
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
  }, [assetInfoMap, earningPositions, priceMap]);

  const onClickItem = useCallback((item: ExtraYieldPositionInfo) => {
    return () => {
      navigate('/home/earning/position-detail', { state: {
        earningSlug: item.slug
      } as EarningPositionDetailParam });
    };
  }, [navigate]);

  const renderItem = useCallback(
    (item: ExtraYieldPositionInfo) => {
      return (
        <EarningPositionItem
          className={'earning-position-item'}
          isShowBalance={isShowBalance}
          key={item.slug}
          onClick={onClickItem(item)}
          positionInfo={item}
        />
      );
    },
    [isShowBalance, onClickItem]
  );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('You can stake in-app easily')}
        emptyTitle={t('No staking found')}
        phosphorIcon={Database}
      />
    );
  }, [t]);

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
  }, [setEntryView]);

  useEffect(() => {
    const address = currentAccount?.address || '';

    if (cacheData[address] === undefined) {
      cacheData = { [address]: !items.length };
    }
  }, [items.length, currentAccount]);

  return (
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
        className={'__section-list-container'}
        enableSearchInput
        list={items}
        renderItem={renderItem}
        renderWhenEmpty={emptyList}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search token')}
        showActionBtn={false}
      />
    </Layout.Base>
  );
}

const EarningPositions = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.__section-list-container': {
    height: '100%',
    flex: 1
  },

  '.earning-position-item': {
    '+ .earning-position-item': {
      marginTop: token.marginXS
    }
  }
}));

export default EarningPositions;
