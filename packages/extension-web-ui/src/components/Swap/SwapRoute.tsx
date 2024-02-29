// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapRoute as SwapRouteType } from '@subwallet/extension-base/types/swap';
import { TokenItemType } from '@subwallet/extension-web-ui/components';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  swapRoute: SwapRouteType;
}

const fakedatas: TokenItemType[] = [
  {
    name: 'Polkadot',
    slug: 'polkadot-NATIVE-DOT',
    symbol: 'DOT',
    originChain: 'polkadot'
  },
  {
    name: 'Kusama',
    slug: 'kusama-NATIVE-KSM',
    symbol: 'KSM',
    originChain: 'kusama'
  },
  {
    name: 'Aleph Zero',
    slug: 'aleph-NATIVE-AZERO',
    symbol: 'AZERO',
    originChain: 'aleph'
  }
];

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  return (
    <>
      <div className={CN(className, '__swap-route-container')}>
        <div className={'__token-item'}>
          <Logo
            className='token-logo'
            isShowSubLogo={false}
            shape='squircle'
            size={24}
            token={'polkadot-NATIVE-DOT'.toLowerCase()}
          />
          <span className={'__item-token'}>DOT</span>
        </div>
        <div className='__first-separator'>
          <div className='__arrow'></div>
        </div>
        {fakedatas.map((fakedata, index) => (
          <div
            className={'__token-item'}
            key={index}
          >
            <Logo
              className='token-logo'
              isShowSubLogo={false}
              shape='squircle'
              size={24}
              token={fakedata.slug.toLowerCase()}
            />
            <span className='__item-token'>{fakedata.symbol}</span>
          </div>
        ))}

        <div className={'__token-item'}>
          <Logo
            className='token-logo'
            isShowSubLogo={false}
            shape='squircle'
            size={24}
            token={'ethereum-NATIVE-ETH'.toLowerCase()}
          />
          <span className={'__item-token'}>ETH</span>
        </div>
      </div>
    </>
  );
};

const SwapRoute = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    '.__token-item': {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      justifyContent: 'center',
      alignItems: 'center'
    },
    '.__first-separator': {
      position: 'absolute',
      height: 2,
      backgroundColor: token['gray-3'],
      marginTop: 12,
      marginBottom: 16,
      left: 33,
      right: 40
    },

    '.__arrow': {
      right: -6,
      top: -4,
      position: 'absolute',
      width: 0,
      height: 0,
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderLeft: `6px solid ${token['gray-3']}`
    }
  };
});

export default SwapRoute;
