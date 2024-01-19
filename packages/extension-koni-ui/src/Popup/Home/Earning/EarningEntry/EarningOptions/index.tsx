// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { EarningOptionItem } from '@subwallet/extension-koni-ui/components/Earning';
import { DEFAULT_EARN_PARAMS, EARN_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { useYieldGroupInfo } from '@subwallet/extension-koni-ui/hooks/earning';
import { EarningEntryView, EarningPoolsParam, ThemeProps, YieldGroupInfo } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  hasEarningPositions: boolean;
  setEntryView: React.Dispatch<React.SetStateAction<EarningEntryView>>;
}

const groupOrdinal = (group: YieldGroupInfo): number => {
  if (group.group === 'DOT-Polkadot') {
    return 2;
  } else if (group.group === 'KSM-Kusama') {
    return 1;
  } else {
    return 0;
  }
};

const testnetOrdinal = (group: YieldGroupInfo): number => {
  return group.isTestnet ? 0 : 1;
};

const balanceOrdinal = (group: YieldGroupInfo): number => {
  return group.balance.value.toNumber();
};

const apyOrdinal = (group: YieldGroupInfo): number => {
  return !group.maxApy ? -1 : group.maxApy;
};

function Component ({ className, hasEarningPositions, setEntryView }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const data = useYieldGroupInfo();
  // @ts-ignore
  const { poolInfoMap } = useSelector((state) => state.earning);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);

  const items = useMemo(() => {
    return [...data].sort((a, b) => {
      return (
        groupOrdinal(b) - groupOrdinal(a) ||
        testnetOrdinal(b) - testnetOrdinal(a) ||
        balanceOrdinal(b) - balanceOrdinal(a) ||
        apyOrdinal(b) - apyOrdinal(a)
      );
    });
  }, [data]);

  const onClickItem = useCallback((chainSlug: string, item: YieldGroupInfo) => {
    return () => {
      if (item.poolListLength > 1) {
        navigate('/home/earning/pools', { state: {
          poolGroup: item.group,
          symbol: item.symbol
        } as EarningPoolsParam });
      } else if (item.poolListLength === 1) {
        const slug = Object.values(poolInfoMap).find(
          (i) => i.group === item.group && i.chain === item.chain
        )?.slug || '';

        setEarnStorage({
          ...DEFAULT_EARN_PARAMS,
          slug,
          chain: item.chain,
          from: currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : ''
        });
        navigate('/transaction/earn');
      }
    };
  }, [currentAccount?.address, navigate, poolInfoMap, setEarnStorage]);

  const renderItem = useCallback(
    (item: YieldGroupInfo) => {
      return (
        <EarningOptionItem
          chain={chainInfoMap[item.chain]}
          className={'earning-option-item'}
          isShowBalance={isShowBalance}
          key={item.group}
          onClick={onClickItem(chainInfoMap[item.chain].slug, item)}
          poolGroup={item}
        />
      );
    },
    [chainInfoMap, isShowBalance, onClickItem]
  );

  const onBack = useCallback(() => {
    setEntryView(EarningEntryView.POSITIONS);
  }, [setEntryView]);

  const searchFunction = useCallback(({ name, symbol }: YieldGroupInfo, searchText: string) => {
    return (
      name?.toLowerCase().includes(searchText.toLowerCase()) ||
      symbol?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, []);

  return (
    <Layout.Base
      className={CN(className)}
      onBack={onBack}
      showBackButton={hasEarningPositions}
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={false}
      subHeaderPaddingVertical={true}
      title={t<string>('Earning options')}
    >
      <SwList.Section
        className={'__section-list-container'}
        enableSearchInput
        list={items}
        renderItem={renderItem}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search token')}
        showActionBtn
      />
    </Layout.Base>
  );
}

const EarningOptions = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.__section-list-container': {
    height: '100%',
    flex: 1
  },

  '.earning-option-item': {
    '+ .earning-option-item': {
      marginTop: token.marginXS
    }
  }
}));

export default EarningOptions;
