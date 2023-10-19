// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { SpinnerGap } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  isMinting?: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, isMinting } = props;

  const { t } = useTranslation();

  return (
    <div className={CN(className)}>
      <div className='page-icon'>
        <PageIcon
          color='var(--page-icon-color)'
          iconProps={{
            weight: 'fill',
            phosphorIcon: SpinnerGap
          }}
        />
      </div>
      <div className='content-container'>
        <div className='title'>
          {
            isMinting
              ? t('Minting NFT...')
              : t('Processing...')
          }
        </div>
        <div className='description'>
          {
            isMinting
              ? t("You're eligible for a free NFT! Please stay on this page while the minting is being processed")
              : t('Please stay on this page while the transaction is being processed')
          }
        </div>
      </div>
    </div>
  );
};

const EarningDoneProcessing = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    marginTop: token.marginLG * 10,
    display: 'flex',
    flexDirection: 'column',
    gap: token.sizeLG,

    '.content-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size
    },

    '.anticon': {
      animation: 'spinner-loading infinite linear 1s'
    },

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      '--page-icon-color': token['gold-6']
    },

    '.title': {
      color: token.colorText,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      fontWeight: token.fontWeightStrong
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
    }
  };
});

export default EarningDoneProcessing;
