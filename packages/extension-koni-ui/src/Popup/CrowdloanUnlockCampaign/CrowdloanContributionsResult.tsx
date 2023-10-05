// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ParaChainInfoMap } from '@subwallet/extension-base/background/KoniTypes';
import { getParaChainInfoMap } from '@subwallet/extension-koni-ui/messaging';
import NoteBox from '@subwallet/extension-koni-ui/Popup/CrowdloanUnlockCampaign/components/NoteBox';
import { CrowdloanContributionsResultParam, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import { Vault } from 'phosphor-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = ({ className }: Props) => {
  const locationState = useLocation().state as CrowdloanContributionsResultParam;
  const [propAddress] = useState<string | undefined>(locationState?.address);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const [, setParaChainInfoMap] = useState<ParaChainInfoMap>({});

  const goEarningDemo = useCallback(() => {
    navigate('/earning-demo');
  }, [navigate]);

  useEffect(() => {
    getParaChainInfoMap().then((rs) => {
      setParaChainInfoMap(rs);
    }).catch((e) => {
      console.log('getParaChainInfoMap Error', e);
    });
  }, []);

  return (
    <div className={className}>
      {propAddress}
      <div className={'__footer-area'}>
        <NoteBox
          className={'__note-box'}
          content={t('There\'re multiple ways you can play with your unlocked DOT, such as native staking, liquid staking, or lending. Check out SubWallet Dashboard for curated options with competitive APY to earn yield on your DOT.')}
          title={t('Crowdloan unlock, then what?')}
        />

        <div className='__footer-buttons'>
          <Button
            className={'__footer-button'}
            contentAlign={'left'}
            icon={
              <Icon
                className='__footer-button-icon'
                phosphorIcon={Vault}
                size='md'
                weight='fill'
              />
            }
            onClick={goEarningDemo}
          >
            <div className={'__footer-button-content'}>
              <div className={'__footer-button-title'}>{t('Rewards: 18% - 24%')}</div>

              <div className={'__footer-button-subtitle'}>{t('Earning with SubWallet Dashboard')}</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

const CrowdloanContributionsResult = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

    '.__footer-area': {
      borderTop: `2px solid ${token.colorBgDivider}`
    },

    '.__note-box': {
      paddingTop: token.sizeLG,
      paddingBottom: token.sizeLG
    },

    '.__footer-buttons': {
      display: 'flex',
      gap: token.size,
      flexWrap: 'wrap'
    },

    '.__footer-button': {
      height: 72,
      flex: 1,
      paddingRight: token.paddingSM,
      paddingLeft: token.paddingSM,
      gap: token.size
    },

    '.__footer-button-icon': {
      width: 40,
      height: 40,
      justifyContent: 'center'
    },

    '.__footer-button-content': {
      textAlign: 'left'
    },

    '.__footer-button-title': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      marginBottom: token.marginXXS
    },

    '.__footer-button-subtitle': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight3
    }
  };
});

export default CrowdloanContributionsResult;
