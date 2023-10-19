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
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { EarningDoneFail, EarningDoneProcessing, EarningDoneSuccess } from './parts';

type Props = ThemeProps;

enum ProcessStatus {
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { chain, transactionId } = useParams<{chain: string, transactionId: string}>();
  const { isWebUI } = useContext(ScreenContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { historyList } = useSelector((state) => state.transactionHistory);

  const [nftData, setNftData] = useState<UnlockDotTransactionNft>();

  const item = useMemo(() => {
    return historyList.find((value) => value.transactionId === transactionId);
  }, [historyList, transactionId]);

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
    // TODO: add callback
  }, []);

  const contactUs = useCallback(() => {
    // TODO: add callback
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
  }, [contactUs, isWebUI, nftData?.nftImage, shareOnTwitter, status, t, viewInHistory]);

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
