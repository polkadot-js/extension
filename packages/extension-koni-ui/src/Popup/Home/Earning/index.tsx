// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldCompoundingPeriod, YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateReward } from '@subwallet/extension-base/koni/api/yield';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import EarningItem from '@subwallet/extension-koni-ui/components/EarningItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);

  // TODO: calculate rewards based on amount - daily, monthly, annually
  useEffect(() => {
    const selectedPool = Object.values(poolInfo)[0];

    if (!selectedPool) {
      return;
    }

    if (selectedPool?.stats?.assetEarning) {
      selectedPool?.stats?.assetEarning.forEach((assetEarningStats) => {
        const assetApr = assetEarningStats?.apr || 0;

        const _1dEarning = calculateReward(assetApr, 100, YieldCompoundingPeriod.DAILY);
        const _7dEarning = calculateReward(assetApr, 100, YieldCompoundingPeriod.WEEKLY);
        const _monthlyEarning = calculateReward(assetApr, 100, YieldCompoundingPeriod.MONTHLY);
        const _yearlyEarning = calculateReward(assetApr, 100, YieldCompoundingPeriod.YEARLY);

        console.log('_1dEarning', _1dEarning);
        console.log('_7dEarning', _7dEarning);
        console.log('_monthlyEarning', _monthlyEarning);
        console.log('_yearlyEarning', _yearlyEarning);
      });
    }
  }, [poolInfo]);

  const renderEarningItem = (item: YieldPoolInfo) => {
    return (
      <EarningItem item={item} />
    );
  };

  return (
    <PageWrapper
      className={`earning ${className}`}
      resolve={dataContext.awaitStores(['yieldPool', 'price'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        // subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t('Earning')}
      >
        <SwList.Section
          className={CN('nft_collection_list__container')}
          displayGrid={true}
          enableSearchInput={false}
          gridGap={'14px'}
          list={Object.values(poolInfo)}
          minColumnWidth={'384px'}
          renderItem={renderEarningItem}
          renderOnScroll={true}
          renderWhenEmpty={<></>}
          searchMinCharactersCount={2}
        />
      </Layout.Base>
    </PageWrapper>

  );
}

const Earning = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex'
  });
});

export default Earning;
