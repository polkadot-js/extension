// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { XCircle } from 'phosphor-react';
import React, { useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  viewInHistory: VoidFunction;
  backToEarning: VoidFunction;
}

const Component: React.FC<Props> = (props: Props) => {
  const { backToEarning, className, viewInHistory } = props;

  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();

  return (
    <div className={CN(className, { mt: !isWebUI })}>
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

    '&.mt': {
      marginTop: token.marginLG
    },

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
