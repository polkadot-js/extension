// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NftItem } from '@subwallet/extension-base/background/KoniTypes';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { _NftCollection } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/utils';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NFT_PER_ROW } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

const NftItemPreview = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/render/NftItemPreview'));
const _NftItem = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/render/NftItem'));

interface Props {
  className?: string;
  data: _NftCollection | undefined;
  onClickBack: () => void;
  currentNetwork: string;

  chosenItem: NftItem;
  setChosenItem: (val: NftItem) => void;

  showItemDetail: boolean;
  setShowItemDetail: (val: boolean) => void;

  setShowCollectionDetail: (val: boolean) => void;
}

function NftCollection ({ chosenItem, className, currentNetwork, data, onClickBack, setChosenItem, setShowCollectionDetail, setShowItemDetail, showItemDetail }: Props): React.ReactElement<Props> {
  const [networkKey, setNetworkKey] = useState(currentNetwork);
  const networkJson = useGetNetworkJson(data?.chain as string);

  const handleShowItem = useCallback((data: NftItem) => {
    setChosenItem(data);
    setShowItemDetail(true);
  }, [setChosenItem, setShowItemDetail]);

  useEffect(() => {
    if (networkKey !== currentNetwork) {
      setShowItemDetail(false);
      setNetworkKey(currentNetwork);
    }
  }, [currentNetwork, networkKey, setShowItemDetail]);

  useEffect(() => { // handle user change network setting during sending process
    if (!networkJson.active) {
      setShowItemDetail(false);
      setShowCollectionDetail(false);
    }
  }, [networkJson.active, setShowCollectionDetail, setShowItemDetail]);

  const handleClickBack = useCallback(() => {
    onClickBack();
  }, [onClickBack]);

  const handleHideItemDetail = useCallback(() => {
    setShowItemDetail(false);
  }, [setShowItemDetail]);

  const goHome = useCallback(() => {
    setShowItemDetail(false);
    onClickBack();
  }, [onClickBack, setShowItemDetail]);

  return (
    <div className={className}>
      {
        !showItemDetail &&
        <div>
          <div className={'header'}>
            <div
              className={'back-icon'}
              onClick={handleClickBack}
            >
              <FontAwesomeIcon
                className='arrowLeftIcon'
                // @ts-ignore
                icon={faArrowLeft}
              />
            </div>
            <div
              className={'header-title'}
              // @ts-ignore
              title={data.collectionName ? data?.collectionName : data?.collectionId}
            >
              {/* @ts-ignore */}
              <div className={'collection-name'}>{data.collectionName ? data?.collectionName : data?.collectionId}</div>
              {/* @ts-ignore */}
              <div className={'collection-item-count'}>{data?.nftItems.length}</div>
            </div>
            <div></div>
          </div>
          <div className={'grid-container'}>
            {
              // @ts-ignore
              data?.nftItems.length > 0 &&
              // @ts-ignore
              data?.nftItems.map((item: NftItem, index: React.Key) => {
                return <div key={`${item.chain || index}/${item.collectionId || ''}/${item.id || ''}`}>
                  <NftItemPreview
                    collectionImage={data?.image}
                    data={item}
                    onClick={handleShowItem}
                  />
                </div>;
              })
            }
          </div>
        </div>
      }

      {
        showItemDetail &&
        <_NftItem
          collectionId={data?.collectionId}
          collectionImage={data?.image}
          data={chosenItem}
          goHome={goHome}
          onClickBack={handleHideItemDetail}
        />
      }
    </div>
  );
}

export default React.memo(styled(NftCollection)(({ theme }: ThemeProps) => `
  .grid-container {
    padding-bottom: 20px;
    width: 100%;
    display: grid;
    column-gap: 20px;
    row-gap: 20px;
    justify-items: center;
    grid-template-columns: repeat(${NFT_PER_ROW}, 1fr);
  }

  .back-icon:hover {
    cursor: pointer;
  }

  .header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .header-title {
    width: 90%;
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 12px;
  }

  .collection-name {
    font-size: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .collection-item-count {
    font-size: 16px;
    font-weight: normal;
    color: #7B8098;
  }
`));
