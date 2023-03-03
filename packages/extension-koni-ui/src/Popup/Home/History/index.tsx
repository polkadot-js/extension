// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { HistoryItem as HistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { HistoryItem } from '@subwallet/extension-koni-ui/components/History/HistoryItem';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { HISTORY_ITEMS } from '@subwallet/extension-koni-ui/constants/history-demo';
import { HistoryDetailModal } from '@subwallet/extension-koni-ui/Popup/Home/History/Detail';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { customFormatDate } from '@subwallet/extension-koni-ui/util/customFormatDate';
import { Icon, ModalContext, SwList, SwSubHeader } from '@subwallet/react-ui';
import { DownloadSimple } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps

const HistoryDetailModalId = 'historyDetailModalId';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItemType | null>(null);

  const onOpenDetail = useCallback((item: HistoryItemType) => {
    return () => {
      setSelectedHistoryItem(item);
    };
  }, []);

  const onCloseDetail = useCallback(() => {
    setSelectedHistoryItem(null);
  }, []);

  // useEffect(() => {
  //   setSelectedHistoryItem(HISTORY_ITEMS[0]);
  // }, []);

  useEffect(() => {
    if (selectedHistoryItem) {
      activeModal(HistoryDetailModalId);
    } else {
      inactiveModal(HistoryDetailModalId);
    }
  }, [activeModal, selectedHistoryItem, inactiveModal]);

  const renderItem = useCallback(
    (item: HistoryItemType) => {
      return (
        <HistoryItem
          item={item}
          key={item.extrinsicHash}
          onClick={onOpenDetail(item)}
        />
      );
    },
    [onOpenDetail]
  );

  const searchFunc = useCallback((item: HistoryItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      (!!item.senderName && item.senderName.toLowerCase().includes(searchTextLowerCase))
    );
  }, []);

  const groupBy = useCallback((item: HistoryItemType) => {
    return customFormatDate(item.time, '#MMM# #DD#, #YYYY#');
  }, []);

  const groupSeparator = useCallback((group: HistoryItemType[], idx: number, groupLabel: string) => {
    return (
      <div className='__group-separator'>{groupLabel}</div>
    );
  }, []);

  return (
    <>
      <PageWrapper className={`history ${className}`}>
        <SwSubHeader
          background={'transparent'}
          center={false}

          paddingVertical
          rightButtons={[
            {
              icon: (
                <Icon
                  phosphorIcon={DownloadSimple}
                  size={'md'}
                  type='phosphor'
                />
              )
            }
          ]}
          showBackButton={false}
          title={t('History')}
        />

        <SwList.Section
          enableSearchInput
          groupBy={groupBy}
          groupSeparator={groupSeparator}
          list={HISTORY_ITEMS}
          renderItem={renderItem}
          searchFunction={searchFunc}
          searchMinCharactersCount={2}
          searchPlaceholder={t('Search website')} // todo: i18n this
        />
      </PageWrapper>
      {!!selectedHistoryItem && (
        <HistoryDetailModal
          data={selectedHistoryItem}
          id={HistoryDetailModalId}
          onCancel={onCloseDetail}
        />
      )}
    </>
  );
}

const History = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    flexDirection: 'column',

    '.ant-sw-list-section': {
      flex: 1
    },
    '.ant-sw-sub-header-container': {
      marginBottom: token.marginXS
    },
    '.history-item + .history-item, .history-item + .___list-separator': {
      marginTop: token.marginXS
    },
    '.___list-separator': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight3,
      fontWeight: token.headingFontWeight,
      marginBottom: token.marginXS
    }
  });
});

export default History;
