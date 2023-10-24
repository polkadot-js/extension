// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicStatus } from '@subwallet/extension-base/background/KoniTypes';
import { UnlockDotTransactionNft } from '@subwallet/extension-base/types';
import { Layout, SocialGroup } from '@subwallet/extension-koni-ui/components';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { unlockDotCheckSubscribe } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { TwitterLogo } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { TwitterShareButton } from 'react-share';
import styled from 'styled-components';

import { EarningDoneFail, EarningDoneProcessing, EarningDoneSuccess } from './parts';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';

type Props = ThemeProps;

enum ProcessStatus {
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

interface TwitterData {
  url: string;
  text: string;
  tags: string[];
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { chain, transactionId } = useParams<{chain: string, transactionId: string}>();
  const { isWebUI } = useContext(ScreenContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { historyList } = useSelector((state) => state.transactionHistory);
  const { poolInfo } = useSelector((state) => state.yieldPool);

  const twitterRef = useRef<HTMLButtonElement>(null);

  const item = useMemo(() => {
    return historyList.find((value) => value.transactionId === transactionId);
  }, [historyList, transactionId]);

  const pool = useMemo(() => Object.values(poolInfo).find((value) => value.chain === chain), [chain, poolInfo]);

  const twitterData = useMemo((): TwitterData | undefined => {
    if (pool) {
      switch (pool.slug) {
        case 'DOT___nomination_pool':
          return {
            text: 'I staked DOT with @Polkadot nomination pools on @subwalletapp web dashboard!\n\nHow about you? #StakeDOT now & earn a free Polkadot Power Staker NFT from Oct 24 to Nov 7 🎊 NFT holders have the chance to win more on @airlyftone🙌',
            url: 'x.subwallet.app/earn-polkadot',
            tags: []
          };
        case 'DOT___acala_liquid_staking':
          return {
            text: 'I staked DOT with @AcalaNetwork liquid staking on @subwalletapp web dashboard!\n\nHow about you? #StakeDOT now & earn exclusive ACA rewards with a free Acala Power Staker NFT from Oct 24 to Nov 7 🎊 NFT holders have the chance to win more on @airlyftone🙌',
            url: 'x.subwallet.app/earn-acala',
            tags: []
          };
        case 'DOT___bifrost_liquid_staking':
          return {
            text: 'I staked DOT with @BifrostFinance liquid staking on @subwalletapp web dashboard!\n\nHow about you? #StakeDOT now & earn exclusive BNC rewards with a free Bifrost Power Staker NFT from Oct 24 to Nov 7 🎊 NFT holders have the chance to win more on @airlyftone',
            url: 'x.subwallet.app/earn-bifrost',
            tags: []
          };
        case 'DOT___parallel_liquid_staking':
          return {
            text: 'I staked DOT with @ParallelFi liquid staking on @subwalletapp web dashboard!\n\nHow about you? #StakeDOT now & earn exclusive PARA rewards with a free Parallel Power Staker NFT from Oct 24 to Nov 7 🎊 NFT holders have the chance to win more on @airlyftone🙌',
            url: 'x.subwallet.app/earn-parallel',
            tags: []
          };
        case 'DOT___interlay_lending':
          return {
            text: 'I supplied DOT to @InterlayHQ lending pool on @subwalletapp web dashboard!\n\nHow about you? Supply DOT now & earn a free Interlay Power Supplier NFT from Oct 24 to Nov 7 🎊 NFT holders have the chance to win more on @airlyftone🙌\n#StakeDOT #EarnMany',
            url: 'x.subwallet.app/earn-interlay',
            tags: []
          };
      }
    }

    return undefined;
  }, [pool]);

  const enableShare = useMemo(() => !!twitterData, [twitterData]);

  const [nftData, setNftData] = useState<UnlockDotTransactionNft>();

  const status = useMemo((): ProcessStatus => {
    if (!item) {
      return ProcessStatus.PROCESSING;
    } else {
      switch (item.status) {
        case ExtrinsicStatus.SUCCESS:
          if (nftData !== undefined) {
            return ProcessStatus.SUCCESS;
          } else {
            return ProcessStatus.PROCESSING;
          }

        case ExtrinsicStatus.FAIL:
        case ExtrinsicStatus.CANCELLED:
          return ProcessStatus.FAIL;
        default:
          return ProcessStatus.PROCESSING;
      }
    }
  }, [item, nftData]);

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

  const backToEarning = useCallback(() => {
    navigate('/home/earning/');
  }, [navigate]);

  const shareOnTwitter = useCallback(() => {
    twitterRef.current?.click();
  }, []);

  const contactUs = useCallback(() => {
    openInNewTab('https://linktr.ee/subwallet.app')();
  }, []);

  const goToNft = useCallback(() => {
    navigate('/home/nfts/collections');
  }, [navigate]);

  const rightFooterButton = useMemo((): ButtonProps | undefined => {
    if (isWebUI) {
      return undefined;
    }

    switch (status) {
      case ProcessStatus.PROCESSING:
        return undefined;
      case ProcessStatus.FAIL:
        return {
          block: true,
          onClick: backToEarning,
          schema: 'secondary',
          children: t('Back to Earning')
        };
      case ProcessStatus.SUCCESS:
        return {
          block: true,
          onClick: viewInHistory,
          schema: 'secondary',
          children: t('View transaction')
        };
    }
  }, [backToEarning, isWebUI, status, t, viewInHistory]);

  const leftFooterButton = useMemo((): ButtonProps | undefined => {
    if (isWebUI) {
      return undefined;
    }

    switch (status) {
      case ProcessStatus.PROCESSING:
        return undefined;
      case ProcessStatus.FAIL:
        return {
          block: true,
          onClick: viewInHistory,
          schema: 'primary',
          children: t('View transaction')
        };

      case ProcessStatus.SUCCESS: {
        if (nftData?.nftImage) {
          return {
            block: true,
            icon: (
              <Icon
                phosphorIcon={TwitterLogo}
                weight='fill'
              />
            ),
            schema: 'primary',
            onClick: shareOnTwitter,
            disabled: !enableShare,
            children: t('Share to Twitter')
          };
        } else {
          return {
            block: true,
            onClick: contactUs,
            schema: 'primary',
            children: t('Contact us')
          };
        }
      }
    }
  }, [contactUs, isWebUI, nftData?.nftImage, shareOnTwitter, status, t, viewInHistory, enableShare]);

  useEffect(() => {
    let unmount = false;

    const callback = (data: UnlockDotTransactionNft) => {
      if (!unmount) {
        setNftData(data);
      }
    };

    unlockDotCheckSubscribe({ transactionId: transactionId || '' }, callback)
      .then(callback)
      .catch(console.error);

    return () => {
      unmount = true;
    };
  }, [transactionId]);

  return (
    <Layout.WithSubHeaderOnly
      className={className}
      leftFooterButton={leftFooterButton}
      rightFooterButton={rightFooterButton}
      title={t('Earning result')}
    >
      <div className={CN('content-container', {
        '__web-ui': isWebUI
      })}
      >
        {
          status === ProcessStatus.PROCESSING && (
            <EarningDoneProcessing isMinting={item?.status && item.status === ExtrinsicStatus.SUCCESS} />
          )
        }
        {
          status === ProcessStatus.FAIL && (
            <EarningDoneFail
              backToEarning={backToEarning}
              viewInHistory={viewInHistory}
            />
          )
        }
        {
          status === ProcessStatus.SUCCESS && (
            <EarningDoneSuccess
              chain={chain}
              contactUs={contactUs}
              enableShare={enableShare}
              goToNft={goToNft}
              shareOnTwitter={shareOnTwitter}
              url={nftData?.nftImage || ''}
              viewInHistory={viewInHistory}
            />
          )
        }
      </div>
      {isWebUI && (
        <SocialGroup className={'social-group'} />
      )}
      {
        twitterData && (
          <TwitterShareButton
            // eslint-disable-next-line react/no-children-prop
            children={undefined}
            className={'hidden'}
            hashtags={twitterData.tags}
            ref={twitterRef}
            title={twitterData.text}
            url={twitterData.url}
          />
        )
      }
    </Layout.WithSubHeaderOnly>
  );
};

const EarningDoneContent = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return {
    '.content-container': {
      textAlign: 'center',

      '&.__web-ui': {
        textAlign: 'center',
        width: extendToken.oneColumnWidth,
        margin: '0 auto'
      }
    },

    '.hidden': {
      display: 'none'
    },

    '.ant-sw-screen-layout-body': {
      position: 'relative'
    },

    '.social-group': {
      alignSelf: 'center',

      '@media (max-height: 894px)': {
        display: 'none'
      }
    },

    '.and-more': {
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,

      '.highlight': {
        color: token.colorTextBase
      }
    },

    '.ant-sw-screen-layout-footer-button-container': {
      flexDirection: 'column',
      padding: `0 ${token.padding}px`,
      gap: token.size,

      '.ant-btn': {
        margin: 0
      }
    }
  };
});

export default EarningDoneContent;
