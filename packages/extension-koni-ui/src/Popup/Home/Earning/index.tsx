// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import EarningItem from '@subwallet/extension-koni-ui/components/EarningItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import EarningCalculatorModal, { STAKING_CALCULATOR_MODAL_ID } from '@subwallet/extension-koni-ui/Popup/Home/Earning/EarningCalculatorModal';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);
  const { activeModal } = useContext(ModalContext);
  const [selectedItem, setSelectedItem] = useState<YieldPoolInfo | undefined>(undefined);

  const onClickCalculatorBtn = useCallback((item: YieldPoolInfo) => {
    setSelectedItem(item);
    activeModal(STAKING_CALCULATOR_MODAL_ID);
  }, [activeModal]);

  const onClickStakeBtn = useCallback((item: YieldPoolInfo) => {
    setSelectedItem(item);
    navigate(`/transaction/earn/${item.slug}`);
  }, [navigate]);

  const renderEarningItem = useCallback((item: YieldPoolInfo) => {
    return (
      <EarningItem
        item={item}
        key={item.slug}
        onClickCalculatorBtn={() => onClickCalculatorBtn(item)}
        onClickStakeBtn={() => onClickStakeBtn(item)}
      />
    );
  }, [onClickCalculatorBtn, onClickStakeBtn]);

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

        {selectedItem && <EarningCalculatorModal item={selectedItem} />}
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
