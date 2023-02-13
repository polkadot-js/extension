// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { NftCollection as NftCollection_ } from '@subwallet/react-ui';
import React, { useCallback, useState } from 'react';
// @ts-ignore
import LazyLoad from 'react-lazyload';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  title: string,
  image: string | undefined,
  fallbackImage?: string | undefined,
  itemCount?: number

  handleOnClick?: (params?: any) => void,
  routingParams?: any,
}

function Component ({ className = '', fallbackImage, handleOnClick, image, itemCount, routingParams, title }: Props): React.ReactElement<Props> {
  const { extendToken } = useTheme() as Theme;

  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [showCollectionImage, setShowCollectionImage] = useState(false);

  const onClick = useCallback(() => {
    handleOnClick && handleOnClick(routingParams);
  }, [handleOnClick, routingParams]);

  const handleOnLoad = useCallback(() => {
    setLoading(false);
  }, []);

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
    if (image) {
      return image;
    } else if (fallbackImage) {
      return fallbackImage;
    }

    return extendToken.logo;
  }, [extendToken.logo, fallbackImage, image]);

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
            src={image}
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
  }, [image, extendToken.logo, getCollectionImage, handleImageError, handleOnLoad, handleVideoError, loading, showCollectionImage, showImage, showVideo]);

  return (
    <NftCollection_
      className={`nft_collection ${className}`}
      count={itemCount || 0}
      customImageNode={getCollectionImageNode()}
      onClick={onClick}
      title={title}
    />
  );
}

export const NftGalleryWrapper = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.__image-wrapper': {
      overflow: 'hidden'
    }
  });
});
