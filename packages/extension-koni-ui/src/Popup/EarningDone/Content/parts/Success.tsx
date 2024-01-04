// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/types';
import { detectTranslate, swParseIPFSUrl } from '@subwallet/extension-base/utils';
import { ImageSlash } from '@subwallet/extension-koni-ui/components';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, Button, Icon, Image, Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, TwitterLogo } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  chain?: string;
  contactUs: VoidFunction;
  goToNft: VoidFunction;
  shareOnTwitter: VoidFunction;
  joinQuest: VoidFunction;
  url: string;
  enableShare: boolean;
  viewInHistory: VoidFunction;
}

const Component: React.FC<Props> = (props: Props) => {
  const { chain, className, contactUs, enableShare, goToNft, joinQuest, shareOnTwitter, url, viewInHistory } = props;

  const { t } = useTranslation();

  const { isWebUI } = useContext(ScreenContext);

  const { poolInfo } = useSelector((state) => state.yieldPool);

  const pool = useMemo(() => Object.values(poolInfo).find((value) => value.chain === chain), [chain, poolInfo]);

  const imageUrl = useMemo(() => {
    return swParseIPFSUrl(url);
  }, [url]);

  const [imageDone, setImageDone] = useState(false);

  const onImageLoad = useCallback(() => {
    setImageDone(true);
  }, []);

  return (
    <div className={CN(className, { mt: !isWebUI })}>
      {
        url && isWebUI && (
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
              i18nKey={
                pool?.type !== YieldPoolType.LENDING
                  ? detectTranslate('<main>Yay! You staked</main><sub><span>in</span><logo /><span>{{poolName}}</span></sub>')
                  : detectTranslate('<main>Yay! You supplied</main><sub><span>in</span><logo /><span>{{poolName}}</span></sub>')
              }
              values={{
                poolName: pool?.metadata.name || ''
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
              src={imageUrl}
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
                <ImageSlash
                  height={52}
                  width={52}
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
                i18nKey={'T&C: From Oct 24 to Nov 7, each address that initiates transactions on each protocol on the SubWallet Earning Dashboard is eligible for 01 free NFT. NFT holders can join quest on Airlyft to earn up to 10 USDT. Check your NFT <highlight>here</highlight>!'}
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
                  (
                    <div className='button-top'>
                      <Button
                        block={true}
                        disabled={!enableShare}
                        icon={(
                          <Icon
                            phosphorIcon={ArrowCircleRight}
                            weight='fill'
                          />
                        )}
                        onClick={joinQuest}
                      >
                        {t('Join quest now')}
                      </Button>
                      <Button
                        block={true}
                        disabled={!enableShare}
                        icon={(
                          <Icon
                            phosphorIcon={TwitterLogo}
                            weight='fill'
                          />
                        )}
                        onClick={shareOnTwitter}
                        schema='secondary'
                      >
                        {t('Share to Twitter')}
                      </Button>
                    </div>
                  )
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

    '&.mt': {
      marginTop: token.marginLG
    },

    '.success-image': {
      width: 470,
      position: 'fixed',
      zIndex: -1,
      top: token.sizeLG,
      left: 'calc(50% - 5px)',
      transform: 'translateX(-50%)'
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

    '.button-top': {
      display: 'flex',
      flexDirection: 'row',
      gap: token.size
    },

    '.title': {
      fontSize: token.fontSizeHeading2,
      lineHeight: token.lineHeightHeading2,
      fontWeight: token.fontWeightStrong,
      color: token.colorSecondary,
      padding: `0 ${token.size}px`,

      '.web-ui-enable &': {
        padding: `0 ${token.sizeXS}px`
      },

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
      justifyContent: 'center',
      padding: `0 ${token.size}px`,

      '.web-ui-enable &': {
        padding: `0 ${token.sizeXS}px`
      }
    },

    '.description': {
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      fontWeight: token.bodyFontWeight,
      padding: `0 ${token.size}px`,

      '.web-ui-enable &': {
        padding: `0 ${token.sizeXS}px`
      }
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
