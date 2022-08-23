// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import transakLogo from '@subwallet/extension-koni-ui/assets/logo/123.transak.png';
import { Button } from '@subwallet/extension-koni-ui/components';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import { PREDEFINED_TRANSAK_NETWORK } from '@subwallet/extension-koni-ui/constants/transak';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import qs from 'querystring';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  networkKey: string;
  formattedAddress: string;
}

const HOST = {
  STAGING: 'https://staging-global.transak.com',
  PRODUCTION: 'https://global.transak.com'
};

const TransakArea = (props: Props) => {
  const { className, formattedAddress, networkKey } = props;

  const { t } = useTranslation();

  const url = useMemo((): string => {
    const host = HOST.PRODUCTION;

    const _network = PREDEFINED_TRANSAK_NETWORK[networkKey];

    if (!_network) {
      return '';
    }

    const networks = [..._network.networks];
    const tokenList = [..._network.tokens];
    const defaultToken = tokenList[0];

    const params = {
      apiKey: '25ac1309-a49b-4411-b20e-5e56c61a5b1c', // MetaMask's apiKey
      defaultCryptoCurrency: defaultToken,
      cryptoCurrencyList: tokenList.join(','),
      networks: networkKey !== 'shiden' ? networks.join(',') : undefined,
      disableWalletAddressForm: true,
      walletAddress: formattedAddress
    };
    const query = qs.stringify(params);

    return `${host}?${query}`;
  }, [formattedAddress, networkKey]);

  return (
    <div className={CN(className)}>
      <img
        alt='Transak logo'
        className='img-logo'
        src={transakLogo}
      />
      {
        !url
          ? (
            <div
              data-for='transak-button'
              data-tip={true}
            >
              <Button
                className={CN(className)}
                isDisabled={true}
              >
                {t('Continue with Transak')}
              </Button>
            </div>
          )
          : (
            <a
              href={url}
              rel='noreferrer'
              target='_blank'
            >
              <Button
                className={CN(className)}
              >
                {t('Continue with Transak')}
              </Button>
            </a>
          )
      }
      <Tooltip
        offset={{
          bottom: 10
        }}
        place='bottom'
        text={'Unsupported network'}
        trigger={'transak-button'}
      />
    </div>
  );
};

export default React.memo(styled(TransakArea)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .img-logo {
    height: 40px;
    margin: 10px 0;
  }
`));
