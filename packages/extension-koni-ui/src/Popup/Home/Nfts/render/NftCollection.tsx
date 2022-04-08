// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import NftItem from '@polkadot/extension-koni-ui/Popup/Home/Nfts/render/NftItem';
import NftItemPreview from '@polkadot/extension-koni-ui/Popup/Home/Nfts/render/NftItemPreview';
import { _NftCollection, _NftItem } from '@polkadot/extension-koni-ui/Popup/Home/Nfts/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { NFT_PER_ROW } from '@polkadot/extension-koni-ui/util';

interface Props {
  className?: string;
  data: _NftCollection | undefined;
  onClickBack: () => void;
  currentNetwork: string;

  chosenItem: _NftItem;
  setChosenItem: (val: _NftItem) => void;

  showItemDetail: boolean;
  setShowItemDetail: (val: boolean) => void;
}

function NftCollection ({ chosenItem, className, currentNetwork, data, onClickBack, setChosenItem, setShowItemDetail, showItemDetail }: Props): React.ReactElement<Props> {
  const [networkKey, setNetworkKey] = useState(currentNetwork);

  const handleShowItem = useCallback((data: _NftItem) => {
    setChosenItem(data);
    setShowItemDetail(true);
  }, [setChosenItem, setShowItemDetail]);

  useEffect(() => {
    if (networkKey !== currentNetwork) {
      console.log('run here');
      setShowItemDetail(false);
      setNetworkKey(currentNetwork);
    }
  }, [currentNetwork, networkKey, setShowItemDetail]);

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
              data?.nftItems.map((item: _NftItem, index: React.Key | null | undefined) => {
                return <div key={index}>
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
        <NftItem
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
    width: 60%;
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
