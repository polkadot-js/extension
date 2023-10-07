// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Image, Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import { TwitterLogo } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { Trans } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { chain, transactionId } = useParams<{chain: string, transactionId: string}>();

  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isWebUI } = useContext(ScreenContext);

  const { poolInfo } = useSelector((state) => state.yieldPool);

  const pool = useMemo(() => Object.values(poolInfo).find((value) => value.chain === chain), [chain, poolInfo]);

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

  const goToNft = useCallback(() => {
    navigate('/home/nfts/collections');
  }, [navigate]);

  return (
    <div className={CN(className)}>
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
      <Image
        height={300}
        shape='default'
        src='/images/subwallet/nft.png'
        width={300}
      />
      <div className='description'>
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
      </div>
      {
        isWebUI && (
          <div className='button-container'>
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
      color: token.colorSecondary
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
