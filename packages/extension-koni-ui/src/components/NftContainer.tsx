import React, {useCallback, useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {RootState, store} from "@polkadot/extension-koni-ui/stores";
import {getNft} from "@polkadot/extension-koni-ui/messaging";
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import styled from 'styled-components';
import Spinner from "@polkadot/extension-koni-ui/components/Spinner";
import NftCollection from "@polkadot/extension-koni-ui/components/NftCollection";
import logo from '../assets/sub-wallet-logo.svg';
// @ts-ignore
import LazyLoad from 'react-lazyload';

interface Props {
  className?: string;
}

function NftContainer ({className}: Props): React.ReactElement<Props> {
  const currentAccount = useSelector((state: RootState) => state.currentAccount);
  const [nftJson, setNftJson] = useState()
  const [nftList, setNftList] = useState()
  const [loading, setLoading] = useState(false)
  const [chosenCollection, setChosenCollection] = useState()
  const [showCollectionDetail, setShowCollectionDetail] = useState(false)

  const _onCreate = useCallback(
    (): void => {
      if (currentAccount && currentAccount.address) {
        setLoading(true)
        getNft(currentAccount.address).then(r => {
          // @ts-ignore
          setNftJson(r)
          // @ts-ignore
          setNftList(r?.nftList)
          store.dispatch({type: 'nft', payload: r})
          setLoading(false)
        }).catch(e => {
          console.error('There is a problem getting NFTs', e)
        })
      } else {
        console.error('There is a problem getting NFTs')
      }
    },
    [currentAccount]
  );

  useEffect(() => {
    _onCreate()
  }, [currentAccount])

  const handleShowCollectionDetail = (data: any) => {
    setShowCollectionDetail(true)
    setChosenCollection(data)
  }

  const NftCollectionPreview = (data: any, index: React.Key | null | undefined) => {
    return (
      <LazyLoad key={index}>
        <div
          className={'nft-preview'}
          style={{height:'164px'}}
          onClick={() => handleShowCollectionDetail(data)}
        >
          <img
            src={data.image ? data?.image : logo}
            className={'collection-thumbnail'}
            alt={'collection-thumbnail'}
            style={{borderRadius: '5px 5px 0 0'}}
          />

          <div className={'collection-title'}>
            <div className={'collection-name'} title={data.collectionName ? data.collectionName : data?.collectionId}>
              {/*show only first 10 characters*/}
              {data.collectionName ? data.collectionName : data?.collectionId}
            </div>
            <div className={'collection-item-count'}>{data?.nftItems.length}</div>
          </div>
        </div>
      </LazyLoad>
    )
  }

  return (
    <div className={className}>
      {loading && <Spinner className={'spinner'}/>}

      {
        !showCollectionDetail &&
        <div className={'grid-container'}>
          {
            !loading && nftList &&
            // @ts-ignore
            nftList.map((item: any, index: React.Key | null | undefined) => {
              // @ts-ignore
              return NftCollectionPreview(item, index)
            })
          }
        </div>
      }

      {
        showCollectionDetail &&
          <NftCollection data={chosenCollection} onClickBack={() => setShowCollectionDetail(false)}/>
      }


      {!loading &&
        <div className={'footer'}>
          <div>Don't see your tokens?</div>
          <div>
            <span className={'link'}>Refresh list</span> or <span className={'link'}>import tokens</span>
          </div>
        </div>
      }
    </div>
  )
}

export default styled(NftContainer)(({theme}: ThemeProps) => `
  width: 100%;

  .spinner {
    margin-top: 50px;
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
    margin-top: 50px;
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

  .nft-preview {
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.2);
    width: 124px;
    &:hover {
      cursor: pointer;
    }

    .collection-thumbnail {
      display: block;
      height: 124px;
      width: 124px;
      object-fit: cover;
    }

    .collection-name {
      width: 70%
      text-transform: capitalize;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .collection-title {
      height: 40px;
      padding-left: 10px;
      padding-right: 10px;
      display: flex;
      align-items: center;
      background-color: #181E42;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.13);
      border-radius: 0 0 5px 5px;
    }

    .collection-item-count {
      font-size: 14px;
      margin-left: 5px;
      font-weight: normal;
      color: #7B8098;
    }
  }
`);
