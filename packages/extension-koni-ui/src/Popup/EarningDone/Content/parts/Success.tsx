// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { baseParseIPFSUrl } from '@subwallet/extension-base/utils';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, Button, Icon, Image, Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import { TwitterLogo } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Trans } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

interface Props extends ThemeProps {
  url: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, url } = props;
  const { chain, transactionId } = useParams<{chain: string, transactionId: string}>();

  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isWebUI } = useContext(ScreenContext);

  const { poolInfo } = useSelector((state) => state.yieldPool);

  const pool = useMemo(() => Object.values(poolInfo).find((value) => value.chain === chain), [chain, poolInfo]);

  const [imageDone, setImageDone] = useState(false);

  const viewInHistory = useCallback(
    () => {
      if (chain && transactionId) {
        navigate(`/home/history/${chain}/${transactionId}`);
      } else {
        navigate('/home/history');
      }
    },
    [chain, transactionId, navigate]
  );

  const shareOnTwitter = useCallback(() => {
    // TODO: add callback
  }, []);

  const contactUs = useCallback(() => {
    // TODO: add callback
  }, []);

  const goToNft = useCallback(() => {
    navigate('/home/nfts/collections');
  }, [navigate]);

  const onImageLoad = useCallback(() => {
    setImageDone(true);
  }, []);

  return (
    <div className={CN(className)}>
      {
        url && (
          <img
            alt='success-gif'
            className={CN('success-image')}
            src='/images/subwallet/mint-nft-done.gif'
          />
        )
      }
      {
        url
          ? (
            <Trans
              components={{
                main: <div className='title' />,
                sub: <div className='sub-title' />,
                logo: (
                  <Logo
                    network={chain}
                    shape='squircle'
                    size={24}
                  />
                ),
                span: <span />
              }}
              i18nKey={'<main>Yay! You staked</main><sub><span>in</span><logo /><span>{{poolName}}</span></sub>'}
              values={{
                poolName: pool?.name || ''
              }}
            />
          )
          : (
            <div className={CN('title', 'warn')}>
              {t("Oops!Your NFT can't be minted")}
            </div>
          )
      }
      <div className='image-container'>
        <div className={CN('image-placeholder', { placeholder: !!url, hidden: imageDone })} />
        {
          url && (
            <Image
              className='nft-image'
              height={300}
              onLoad={onImageLoad}
              shape='default'
              src={baseParseIPFSUrl(url)}
              width={300}
            />
          )
        }
        <div
          className={CN('image-placeholder', 'transparent', 'placeholder', { hidden: imageDone })}
        >
          {
            url
              ? (
                <ActivityIndicator size={52} />
              )
              : (
                <Icon
                  customIcon={(
                    <Image
                      height={52}
                      shape='square'
                      src={'/images/image-not-supported.svg'}
                      width={52}
                    />
                  )}
                  type='customIcon'
                />
              )
          }
        </div>
      </div>
      <div className='description'>
        {
          url
            ? (
              <Trans
                components={{
                  highlight: (
                    <span
                      className='highlight'
                      onClick={goToNft}
                    />
                  )
                }}
                i18nKey={'T&C: From Oct 24 to Nov 7, each address that initiates transactions on each protocol on the SubWallet Earning Dashboard is eligible for 01 free NFT. Check your NFT <highlight>here</highlight>!'}
              />
            )
            : (
              t("Too many people are using SubWallet web dashboard! Don't worry, your transaction is successful and we'll mint another NFT for you. Check back in a few hours or contact us for support.")
            )
        }
      </div>
      {
        isWebUI && (
          <div className='button-container'>
            {
              url
                ? (
                  <Button
                    block={true}
                    icon={(
                      <Icon
                        phosphorIcon={TwitterLogo}
                        weight='fill'
                      />
                    )}
                    onClick={shareOnTwitter}
                  >
                    {t('Share to Twitter')}
                  </Button>
                )
                : (
                  <Button
                    block={true}
                    onClick={contactUs}
                  >
                    {t('Contact us')}
                  </Button>
                )
            }
            <Button
              block={true}
              onClick={viewInHistory}
              schema='secondary'
            >
              {t('View transaction')}
            </Button>
          </div>
        )
      }
    </div>
  );
};

const EarningDoneSuccess = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: token.sizeLG,

    '.success-image': {
      width: 470,
      position: 'absolute',
      zIndex: -1,
      top: token.sizeLG,
      marginLeft: -40
    },

    '.image-container': {
      position: 'relative'
    },

    '.image-placeholder': {
      width: 300,
      height: 300,
      marginLeft: 'auto',
      marginRight: 'auto',
      backgroundColor: token.colorBgInput,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      '&.placeholder': {
        top: 0,
        left: 0,
        right: 0,
        position: 'absolute'
      },

      '&.hidden': {
        display: 'none'
      },

      '&.transparent': {
        backgroundColor: token.colorTransparent
      }
    },

    '.nft-image': {
      borderRadius: 12
    },

    '.button-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size,
      padding: `0 ${token.sizeXS}px`
    },

    '.title': {
      fontSize: token.fontSizeHeading2,
      lineHeight: token.lineHeightHeading2,
      fontWeight: token.fontWeightStrong,
      color: token.colorSecondary,

      '&.warn': {
        color: token.colorWarning,
        whiteSpace: 'pre-line'
      }
    },

    '.sub-title': {
      marginTop: -token.margin,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite,
      display: 'flex',
      flexDirection: 'row',
      gap: token.sizeXXS,
      alignItems: 'center',
      justifyContent: 'center'
    },

    '.description': {
      paddingLeft: token.paddingXS,
      paddingRight: token.paddingXS,
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      fontWeight: token.bodyFontWeight
    },

    '.highlight': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorLink,
      textDecoration: 'underline',
      cursor: 'pointer'
    }
  };
});

export default EarningDoneSuccess;
