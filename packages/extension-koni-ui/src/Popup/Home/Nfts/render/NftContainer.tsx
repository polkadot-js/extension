// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';

import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import useFetchNftExtra from '@polkadot/extension-koni-ui/hooks/screen/home/useFetchNftTransferExtra';
import EmptyList from '@polkadot/extension-koni-ui/Popup/Home/Nfts/render/EmptyList';
import NftCollection from '@polkadot/extension-koni-ui/Popup/Home/Nfts/render/NftCollection';
import { _NftCollection, _NftItem } from '@polkadot/extension-koni-ui/Popup/Home/Nfts/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { NFT_GRID_SIZE } from '@polkadot/extension-koni-ui/util';

import NftCollectionPreview from './NftCollectionPreview';

interface Props extends ThemeProps {
  className?: string;
  nftList: _NftCollection[];
  totalItems: number;
  totalCollection: number;
  loading: boolean;
  page: number;
  setPage: (newPage: number) => void;

  showTransferredCollection: boolean;
  setShowTransferredCollection: (val: boolean) => void;

  chosenCollection: _NftCollection;
  setChosenCollection: (val: _NftCollection) => void;

  showCollectionDetail: boolean;
  setShowCollectionDetail: (val: boolean) => void;

  chosenItem: _NftItem;
  setChosenItem: (val: _NftItem) => void;

  showItemDetail: boolean;
  setShowItemDetail: (val: boolean) => void;
}

function NftContainer (
  { chosenCollection,
    chosenItem,
    className,
    loading,
    nftList,
    page,
    setChosenCollection,
    setChosenItem,
    setPage,
    setShowCollectionDetail,
    setShowItemDetail,
    setShowTransferredCollection,
    showCollectionDetail,
    showItemDetail,
    showTransferredCollection,
    totalCollection,
    totalItems }: Props
): React.ReactElement<Props> {
  const selectedNftCollection = useFetchNftExtra(showTransferredCollection);

  const handleShowCollectionDetail = useCallback((data: _NftCollection) => {
    setShowCollectionDetail(true);
    setChosenCollection(data);
  }, [setChosenCollection, setShowCollectionDetail]);

  useEffect(() => {
    if (!showTransferredCollection && selectedNftCollection) { // show collection after transfer
      setChosenCollection(selectedNftCollection);
      setShowCollectionDetail(true);
      setShowTransferredCollection(true);
    }
  }, [selectedNftCollection, setChosenCollection, setShowCollectionDetail, setShowTransferredCollection, showTransferredCollection]);

  useEffect(() => {
    if (loading) {
      setPage(1);
      setShowItemDetail(false);
      setShowCollectionDetail(false);
    }
  }, [loading, setPage, setShowCollectionDetail, setShowItemDetail]);

  const handleHideCollectionDetail = useCallback(() => {
    setShowCollectionDetail(false);
  }, [setShowCollectionDetail]);

  const onPreviousClick = useCallback(() => {
    if (page === 1) return;

    setPage(page - 1);
  }, [page, setPage]);

  const onNextClick = useCallback(() => {
    const nextPage = page + 1;
    // const from = (nextPage - 1) * NFT_GRID_SIZE;

    if (page >= Math.ceil(totalCollection / NFT_GRID_SIZE)) return;

    setPage(nextPage);
  }, [page, setPage, totalCollection]);

  return (
    <div className={`${className as string} scroll-container`}>
      {loading && <div className={'loading-container'}>
        <Spinner size={'large'} />
      </div>}

      {/* @ts-ignore */}
      {totalItems === 0 && !loading && !showCollectionDetail &&
        <EmptyList />
      }

      {/* @ts-ignore */}
      {!loading && !showCollectionDetail && totalItems > 0 &&
      <div className={'total-title'}>
        {/* @ts-ignore */}
        {totalItems} NFT{totalItems > 1 && 's'} from {totalCollection} collection{totalCollection > 1 && 's'}
      </div>
      }

      {
        !showCollectionDetail &&
        <div className={'grid-container'}>
          {
            !loading && nftList.length > 0 &&
            // @ts-ignore
            nftList.map((item: _NftCollection, index: React.Key | null | undefined) => {
              // @ts-ignore
              return <div key={index}>
                <NftCollectionPreview
                  data={item}
                  onClick={handleShowCollectionDetail}
                />
              </div>;
            })
          }
        </div>
      }

      {
        showCollectionDetail &&
          <NftCollection
            chosenItem={chosenItem}
            data={chosenCollection}
            onClickBack={handleHideCollectionDetail}
            setChosenItem={setChosenItem}
            setShowItemDetail={setShowItemDetail}
            showItemDetail={showItemDetail}
          />
      }

      {
        // @ts-ignore
        !loading && !showCollectionDetail && totalCollection > NFT_GRID_SIZE &&
        <div className={'pagination'}>
          <div
            className={'nav-item'}
            onClick={onPreviousClick}
          >
            <FontAwesomeIcon
              className='arrowLeftIcon'
              // @ts-ignore
              icon={faArrowLeft}
            />
          </div>
          <div>
            {page}/{Math.ceil(totalCollection / NFT_GRID_SIZE)}
          </div>
          <div
            className={'nav-item'}
            onClick={onNextClick}
          >
            <FontAwesomeIcon
              className='arrowLeftIcon'
              // @ts-ignore
              icon={faArrowRight}
            />
          </div>
        </div>
      }

      {/* {!loading && */}
      {/*  <div className={'footer'}> */}
      {/*    <div>Don't see your tokens?</div> */}
      {/*    <div> */}
      {/*      <span */}
      {/*        className={'link'} */}
      {/*        onClick={() => _onChangeState()} */}
      {/*      >Refresh list</span> or <span className={'link'}>import tokens</span> */}
      {/*    </div> */}
      {/*  </div> */}
      {/* } */}
    </div>
  );
}

export default React.memo(styled(NftContainer)(({ theme }: Props) => `
  width: 100%;
  padding: 0 25px;
  padding-bottom: 20px;

  .loading-container {
    height: 100%;
    width:100%;
  }

  .nav-item {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 16px;
    border-radius: 5px;
    background-color: ${theme.popupBackground};
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.13);
  }

  .nav-item:hover {
    cursor: pointer;
  }

  .pagination {
    margin-top: 25px;
    margin-bottom: 25px;
    display: flex;
    width: 100%;
    gap: 20px;
    justify-content: center;
  }

  .total-title {
    margin-bottom: 20px;
  }

  .grid-container {
    width: 100%;
    display: grid;
    column-gap: 20px;
    row-gap: 20px;
    justify-items: center;
    grid-template-columns: repeat(3, 1fr);
  }

  .footer {
    margin-top: 20px;
    margin-bottom: 10px;
    width: 100%;
    color: #9196AB;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .link {
    color: #42C59A;
  }

  .link:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`));
