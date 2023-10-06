// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { XCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { chain, transactionId } = useParams<{chain: string, transactionId: string}>();
  const navigate = useNavigate();

  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();

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
    navigate('/home/earning');
  }, [navigate]);

  return (
    <div className={CN(className)}>
      <div className='page-icon'>
        <PageIcon
          color='var(--page-icon-color)'
          iconProps={{
            weight: 'fill',
            phosphorIcon: XCircle
          }}
        />
      </div>
      <div className='content-container'>
        <div className='title'>
          {t('Failed')}
        </div>
        <div className='description'>
          {t("Your transaction can't be completed. Please try again later.")}
        </div>
      </div>
      {
        isWebUI && (
          <div className='button-container'>
            <Button
              block={true}
              onClick={viewInHistory}
            >
              {t('View transaction')}
            </Button>
            <Button
              block={true}
              onClick={backToEarning}
              schema='secondary'
            >
              {t('Back to Earning')}
            </Button>
          </div>
        )
      }
    </div>
  );
};

const EarningDoneFail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: token.sizeLG,

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.marginLG,
      '--page-icon-color': token.colorError
    },

    '.content-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size
    },

    '.button-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size,
      padding: `0 ${token.sizeXS}px`
    },

    '.title': {
      color: token.colorText,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      fontWeight: token.fontWeightStrong
    },

    '.description': {
      paddingLeft: token.paddingXS,
      paddingRight: token.paddingXS,
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      fontWeight: token.bodyFontWeight
    }
  };
});

export default EarningDoneFail;
