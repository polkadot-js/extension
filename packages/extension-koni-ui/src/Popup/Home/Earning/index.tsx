// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { PageWrapper, Layout } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import EarningItem from '@subwallet/extension-koni-ui/components/EarningItem';
import { SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { useSelector } from 'react-redux';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';

type Props = ThemeProps;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);

  const renderEarningItem = (item: YieldPoolInfo) => {
    return (
      <EarningItem item={item} />
    );
  }

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
    display: 'flex',
  });
});

export default Earning;
