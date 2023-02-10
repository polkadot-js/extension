// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { INftCollectionDetail } from '@subwallet/extension-koni-ui/Popup/Home/Nfts/types';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NftCollection as NftCollection_ } from '@subwallet/react-ui';
import React, { useCallback, useState } from 'react';
// @ts-ignore
import LazyLoad from 'react-lazyload';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  collectionInfo: NftCollection,
  nftList: NftItem[]
}

function Component ({ className = '', collectionInfo, nftList }: Props): React.ReactElement<Props> {
  const { extendToken } = useTheme() as Theme;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [showCollectionImage, setShowCollectionImage] = useState(false);

  const handleOnLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleOnClick = useCallback(() => {
    navigate('/home/nfts/collection-detail', { state: { collectionInfo, nftList } as INftCollectionDetail });
  }, [collectionInfo, navigate, nftList]);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setShowImage(false);
    setShowVideo(true);
  }, []);

  const handleVideoError = useCallback(() => {
    setLoading(false);
    setShowVideo(false);
    setShowCollectionImage(true);
  }, []);

  const getCollectionImage = useCallback(() => {
    if (collectionInfo.image) {
      return collectionInfo.image;
    } else {
      for (const nft of nftList) { // fallback to any nft image
        if (nft.image) {
          return nft.image;
        }
      }
    }

    return extendToken.logo;
  }, [collectionInfo.image, extendToken.logo, nftList]);

  const getCollectionImageNode = useCallback(() => {
    if (showImage) {
      return (
        <LazyLoad>
          <img
            alt={'collection_thumbnail'}
            className={'collection_thumbnail'}
            onError={handleImageError}
            onLoad={handleOnLoad}
            src={getCollectionImage()}
            style={{ borderRadius: '5px 5px 0 0', opacity: loading ? '0.3' : '1' }}
          />
        </LazyLoad>
      );
    }

    if (showVideo) {
      return (
        <LazyLoad>
          <video
            autoPlay
            height='124'
            loop={true}
            muted
            onError={handleVideoError}
            width='124'
          >
            <source
              src={getCollectionImage()}
              type='video/mp4'
            />
          </video>
        </LazyLoad>
      );
    }

    if (showCollectionImage) {
      return (
        <LazyLoad>
          <img
            alt={'collection_thumbnail'}
            className={'collection_thumbnail'}
            onError={handleImageError}
            onLoad={handleOnLoad}
            src={collectionInfo.image}
          />
        </LazyLoad>
      );
    }

    return (
      <img
        alt={'default-img'}
        className={'collection_thumbnail'}
        src={extendToken.logo}
      />
    );
  }, [collectionInfo.image, extendToken.logo, getCollectionImage, handleImageError, handleOnLoad, handleVideoError, loading, showCollectionImage, showImage, showVideo]);

  return (
    <NftCollection_
      className={`nft_collection ${className}`}
      count={nftList.length}
      customImageNode={getCollectionImageNode()}
      key={`${collectionInfo.collectionId}_${collectionInfo.chain}`}
      onClick={handleOnClick}
      title={collectionInfo.collectionName || collectionInfo.collectionId}
    />
  );
}

export const NftCollectionWrapper = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.__image-wrapper': {
      overflow: 'hidden'
    }
  });
});
