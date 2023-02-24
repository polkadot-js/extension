// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import DualLogo from '@subwallet/extension-koni-ui/components/Logo/DualLogo';
// import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, Image } from '@subwallet/react-ui';
import CN from 'classnames';
import { Info, Swatches } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
// import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import LogosMap from '../../assets/logo';

const FooterIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={Swatches}
    size='sm'
    weight='fill'
  />
);

type Props = ThemeProps

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();

  const { className } = props;
  const { t } = useTranslation();
  // const navigate = useNavigate();

  // const accountName = useGetDefaultAccountName();

  return (
    <Layout.Base
      rightFooterButton={{
        children: t('Connect Ledger device'),
        icon: FooterIcon
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: <Icon
            phosphorIcon={Info}
            size='sm'
          />
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t('Connect Ledger device')}
    >
      <div className={CN(className, 'container')}>
        <div className='sub-title'>
          {t('Connect and unlock your Ledger, then open the DApps on your Ledger.')}
        </div>
        <div className='logo'>
          <DualLogo
            leftLogo={(
              <Image
                height={56}
                shape='squircle'
                src={LogosMap.subwallet}
                width={56}
              />
            )}
            rightLogo={(
              <Image
                height={56}
                shape='squircle'
                src={LogosMap.ledger}
                width={56}
              />
            )}
          />
        </div>
      </div>
    </Layout.Base>
  );
};

const ConnectLedger = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.container': {
      padding: token.padding
    },

    '.sub-title': {
      padding: `0 ${token.padding}px`,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.logo': {
      margin: `${token.controlHeightLG}px 0`,
      '--logo-size': token.controlHeightLG + token.controlHeightXS
    }
  };
});

export default ConnectLedger;
