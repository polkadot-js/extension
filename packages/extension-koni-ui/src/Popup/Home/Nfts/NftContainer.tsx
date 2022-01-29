// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
// @ts-ignore
import LazyLoad from 'react-lazyload';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import NftCollection from '@polkadot/extension-koni-ui/Popup/Home/Nfts/NftCollection';
import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import { getNft } from '@polkadot/extension-koni-ui/messaging';
import { RootState, store } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

import NftCollectionPreview from './NftCollectionPreview';
import EmptyList from "@polkadot/extension-koni-ui/Popup/Home/Nfts/EmptyList";

interface Props {
  className?: string;
}

function NftContainer ({ className }: Props): React.ReactElement<Props> {
  const currentAccount = useSelector((state: RootState) => state.currentAccount);
  // const nftStore = useSelector((state: RootState) => state.nft)
  const [nftJson, setNftJson] = useState();
  const [nftList, setNftList] = useState();
  const [loading, setLoading] = useState(false);
  const [chosenCollection, setChosenCollection] = useState();
  const [showCollectionDetail, setShowCollectionDetail] = useState(false);
  const [totalCollection, setTotalCollection] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(9);
  const [currentNftList, setCurrentNftList] = useState();

  const _onCreate = useCallback(
    (): void => {
      console.log('here')
      if (currentAccount.account && currentAccount.account.address) {
        console.log('handling')
        setLoading(true);
        getNft(currentAccount.account.address).then((r) => {
          // @ts-ignore
          setNftJson(r);
          const nftList = r?.nftList;
          const total = nftList.length;
          // @ts-ignore
          setNftList(nftList);
          setTotalCollection(total);
          // @ts-ignore
          setCurrentNftList(nftList.slice(0, total > 9 ? 9 : total));
          store.dispatch({ type: 'nft', payload: r });
          setLoading(false);
        }).catch((e) => {
          console.error('There is a problem getting NFTs', e);
        });
      } else {
        console.error('There is a problem getting NFTs');
      }
    },
    [currentAccount]
  );

  useEffect(() => {
    _onCreate();
  }, [currentAccount]);

  const handleShowCollectionDetail = (data: any) => {
    setShowCollectionDetail(true);
    setChosenCollection(data);
  };

  const onPreviousClick = () => {
    if (page === 1) return;
    const prevPage = page - 1;
    const from = (prevPage - 1) * size;
    const to = from + size;

    setPage(prevPage);
    setCurrentNftList(nftList.slice(from, to));
  };

  const onNextClick = () => {
    const nextPage = page + 1;
    const from = (nextPage - 1) * size;
    const to = from + size;

    if (from > totalCollection) return;

    setPage(nextPage);
    setCurrentNftList(nftList.slice(from, to));
  };

  return (
    <div className={className}>
      {loading && <div className={'loading-container'}>
        <Spinner size={'large'}/>
      </div>}

      {nftJson?.total === 0 && !loading &&
        <EmptyList/>
      }

      {!loading && !showCollectionDetail && nftJson?.total > 0 &&
      <div className={'total-title'}>
        You own {nftJson?.total} NFTs from {totalCollection} collections
      </div>
      }

      {
        !showCollectionDetail &&
        <div className={'grid-container'}>
          {
            !loading && nftList &&
            // @ts-ignore
            currentNftList.map((item: any, index: React.Key | null | undefined) => {
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
          <LazyLoad>
            <NftCollection
              data={chosenCollection}
              onClickBack={() => setShowCollectionDetail(false)}
            />
          </LazyLoad>
      }

      {
        !loading && !showCollectionDetail && nftJson?.total > 0 &&
        <div className={'pagination'}>
          <div
            className={'nav-item'}
            onClick={() => onPreviousClick()}
          >
            <FontAwesomeIcon
              className='arrowLeftIcon'
              icon={faArrowLeft}
            />
          </div>
          <div
            className={'nav-item'}
            onClick={() => onNextClick()}
          >
            <FontAwesomeIcon
              className='arrowLeftIcon'
              icon={faArrowRight}
            />
          </div>
        </div>
      }

      {!loading &&
        <div className={'footer'}>
          <div>Don't see your tokens?</div>
          <div>
            <span
              className={'link'}
              onClick={() => _onCreate()}
            >Refresh list</span> or <span className={'link'}>import tokens</span>
          </div>
        </div>
      }
    </div>
  );
}

export default React.memo(styled(NftContainer)(({ theme }: Props) => `
  width: 100%;
  padding: 0 25px;

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
    background-color: #181E42;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.13);
  }

  .nav-item:hover {
    cursor: pointer;
  }

  .pagination {
    margin-top: 25px;
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
