// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import styled from 'styled-components';

import NftItem from '@polkadot/extension-koni-ui/Popup/Home/Nfts/NftItem';
import NftItemPreview from '@polkadot/extension-koni-ui/Popup/Home/Nfts/NftItemPreview';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props {
  className?: string;
  data: any;
  onClickBack: () => void;
}

function NftCollection ({ className, data, onClickBack }: Props): React.ReactElement<Props> {
  const [chosenItem, setChosenItem] = useState();
  const [showItemDetail, setShowItemDetail] = useState(false);

  const handleShowItem = (data: any) => {
    setChosenItem(data);
    setShowItemDetail(true);
  };

  return (
    <div className={className}>
      {
        !showItemDetail &&
        <div>
          <div className={'header'}>
            <div
              className={'back-icon'}
              onClick={() => onClickBack()}
            >
              <FontAwesomeIcon
                className='arrowLeftIcon'
                icon={faArrowLeft}
              />
            </div>
            <div
              className={'header-title'}
              title={data.collectionName ? data?.collectionName : data?.collectionId}
            >
              <div className={'collection-name'}>{data.collectionName ? data?.collectionName : data?.collectionId}</div>
              <div className={'collection-item-count'}>{data?.nftItems.length}</div>
            </div>
            <div></div>
          </div>
          <div className={'grid-container'}>
            {
              data?.nftItems.length > 0 &&
              data?.nftItems.map((item: any, index: React.Key | null | undefined) => {
                return <div key={index}>
                  <NftItemPreview
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
          data={chosenItem}
          onClickBack={() => setShowItemDetail(false)}
        />
      }

    </div>
  );
}

export default styled(NftCollection)(({ theme }: ThemeProps) => `
  .grid-container {
    width: 100%;
    display: grid;
    column-gap: 20px;
    row-gap: 20px;
    justify-items: center;
    grid-template-columns: repeat(3, 1fr);
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


`);
