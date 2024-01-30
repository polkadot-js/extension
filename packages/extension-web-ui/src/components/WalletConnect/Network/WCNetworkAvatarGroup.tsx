// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-web-ui/types';
import { Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  networks: Array<WalletConnectChainInfo>;
}

const sizeLogo = {
  default: 20,
  large: 24
};

const Component: React.FC<Props> = ({ className, networks }: Props) => {
  const showCount: number = useMemo((): number => {
    return networks.length > 2 ? 3 : 2;
  }, [networks]);

  const countMore: number = useMemo((): number => {
    return networks.length - 3;
  }, [networks]);

  return (
    <div className={className}>
      <div className={CN('content-container', { 'ml-strong': countMore > 0 })}>
        {
          networks.slice(0, 3).map((network, index) => {
            return (
              <div
                className={CN(
                  'avatar-content',
                  {
                    'avatar-blur': index === 2 && countMore > 0
                  }
                )}
                key={network.slug}
              >
                <Logo
                  className='icon'
                  network={network.slug}
                  shape='squircle'
                  size={showCount === 3 ? sizeLogo.default : sizeLogo.large}
                />
              </div>
            );
          })
        }
        {
          countMore > 0 && (
            <div className='cont-more'>+{countMore}</div>
          )
        }
      </div>
    </div>
  );
};

const WCNetworkAvatarGroup = styled(Component)<Props>(({ theme }: Props) => {
  const { token } = theme;

  return {
    position: 'relative',
    width: 'fit-content',

    '.ant-sw-avatar': {
      background: token.colorBgSecondary,

      '.icon': {
        overflow: 'hidden'
      }
    },

    '.content-container': {
      display: 'flex',
      flexDirection: 'row',

      '.avatar-content': {
        marginLeft: -8
      },

      '&.ml-strong': {
        '.avatar-content': {
          marginLeft: -10
        }
      }
    },

    '.avatar-content:first-child': {
      marginLeft: '0 !important',
      opacity: 0.5
    },

    '.avatar-content:last-child': {
      opacity: 1
    },

    '.avatar-blur': {
      '.icon': {
        opacity: 0.5
      }
    },

    '.cont-more': {
      fontSize: token.sizeXS,
      lineHeight: `${token.size}px`,
      position: 'absolute',
      width: token.sizeMD,
      height: token.sizeMD,
      right: 0,
      top: 0,
      fontWeight: 700,
      color: token.colorTextBase,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
});

export default WCNetworkAvatarGroup;
