// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import styled from 'styled-components';
import Spinner from '@polkadot/extension-koni-ui/components/Spinner';
import EmptyList from '@polkadot/extension-koni-ui/Popup/Home/Nfts/EmptyList';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import NftCollectionPreview from './NftCollectionPreview';
import {NftJson} from "@polkadot/extension-base/background/KoniTypes";
import NftCollection from './NftCollection';

interface Props extends ThemeProps {
  className?: string;
  nftList: any[];
  nftJson: NftJson;
  totalCollection: number;
  loading: boolean;
}

const size = 9;

function NftContainer ({ className, nftJson, nftList, totalCollection, loading }: Props): React.ReactElement<Props> {
  // const [nftJson, setNftJson] = useState();
  // const [nftList, setNftList] = useState();
  // const [totalCollection, setTotalCollection] = useState(0);
  // const [loading, setLoading] = useState(false);

  const [chosenCollection, setChosenCollection] = useState();
  const [showCollectionDetail, setShowCollectionDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [currentNftList, setCurrentNftList] = useState(nftList.slice(0, totalCollection > size ? size : totalCollection));

  // const { nft: nftReducer } = useSelector((state: RootState) => state);
  // const _onChangeState = (): void => {
  //   if (!nftReducer?.ready) {
  //     setLoading(true);
  //     return;
  //   }
  //
  //   const nftList = nftReducer?.nftList;
  //   const total = nftList.length;
  //
  //   // @ts-ignore
  //   setNftJson(nftReducer);
  //   // @ts-ignore
  //   setNftList(nftList);
  //   setTotalCollection(total);
  //   // @ts-ignore
  //   setCurrentNftList(nftList.slice(0, total > size ? size : total));
  //   setLoading(false);
  // };
  //
  // useEffect(() => {
  //   _onChangeState();
  // }, [nftReducer]);

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
    // @ts-ignore
    setCurrentNftList(nftList.slice(from, to));
  };

  const onNextClick = () => {
    const nextPage = page + 1;
    const from = (nextPage - 1) * size;
    const to = from + size;

    if (from > totalCollection) return;

    setPage(nextPage);
    // @ts-ignore
    setCurrentNftList(nftList.slice(from, to));
  };

  return (
    <div className={className}>
      {loading && <div className={'loading-container'}>
        <Spinner size={'large'} />
      </div>}

      {/* @ts-ignore */}
      {nftJson?.total === 0 && !loading &&
        <EmptyList />
      }

      {/* @ts-ignore */}
      {!loading && !showCollectionDetail && nftJson?.total > 0 &&
      <div className={'total-title'}>
        {/* @ts-ignore */}
        {nftJson?.total} NFT{nftJson?.total > 1 && 's'} from {totalCollection} collection{totalCollection > 1 && 's'}
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
          <NftCollection
            data={chosenCollection}
            onClickBack={() => setShowCollectionDetail(false)}
          />
      }

      {
        // @ts-ignore
        !loading && !showCollectionDetail && nftJson?.total > size &&
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
          <div>
            {page}/{Math.round(totalCollection / size)}
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
