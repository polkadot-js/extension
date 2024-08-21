// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

export interface NetworkGroupProps extends ThemeProps {
  chains: string[]
}

const Component: React.FC<NetworkGroupProps> = (props: NetworkGroupProps) => {
  const { chains, className } = props;

  const countMore: number = chains.length - 3;

  return (
    <div className={CN('chain-logos', className)}>
      <div className='container'>
        <div className='content-container'>
          {
            chains.slice(0, 3).map((chain, index) => {
              return (
                <div
                  className={CN(
                    'avatar-content',
                    {
                      'avatar-blur': index === 2 && countMore > 0
                    }
                  )}
                  key={index}
                >
                  <Logo
                    className={'__chain-logo'}
                    network={chain}
                    shape='circle'
                    size={16}
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
        <div className={'content-container-hover'}>
          {
            chains.slice(0, chains.length).map((chain, index) => {
              return (
                <div
                  className={CN('avatar-content')}
                  key={index}
                  style={{
                    transitionDelay: `${index * 0.1}s`
                  }}
                >
                  <Logo
                    className={'__chain-logo'}
                    network={chain}
                    shape='circle'
                    size={16}
                  />
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
};

const AnimatedNetworkGroup = styled(Component)<NetworkGroupProps>(({ theme: { token } }: NetworkGroupProps) => {
  return {
    width: 'fit-content',
    position: 'relative',

    '.ant-image, .ant-image-img': {
      display: 'block'
    },

    '.ant-sw-avatar': {
      background: token.colorBgSecondary,

      '.icon': {
        overflow: 'hidden'
      }
    },

    '.container': {
      maxHeight: 20,

      '.content-container, .content-container-hover': {
        display: 'flex',
        height: token.sizeMD,
        alignItems: 'center',
        flexDirection: 'row',
        position: 'relative',
        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out'
      },

      '.content-container': {
        display: 'inline-flex',
        opacity: 1,
        visibility: 'visible',

        '.avatar-content': {
          marginLeft: -8,
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',

          '.ant-image-img': {
            boxSizing: 'content-box'
          }
        },

        '&.ml-strong': {
          '.avatar-content': {
            marginLeft: -10
          }
        }
      },

      '.content-container-hover': {
        opacity: 0,
        visibility: 'hidden',
        gap: 4,
        position: 'absolute',
        top: 0,

        '.avatar-content': {
          opacity: 0,
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
        },

        '&.ml-strong': {
          '.avatar-content': {
            marginLeft: -10
          }
        }
      },

      '&:hover': {
        '.content-container': {
          opacity: 0,
          visibility: 'hidden'
        },
        '.content-container-hover': {
          position: 'absolute',
          top: 0,
          opacity: 1,
          visibility: 'visible',

          '.avatar-content': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }
    },

    '.avatar-content:first-child': {
      marginLeft: '0 !important'
    },

    '.avatar-content:first-child, .avatar-blur': {
      position: 'relative',

      '&:after': {
        content: '""',
        position: 'absolute',
        display: 'block',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: token.borderRadiusLG
      }
    },

    '.avatar-content:last-child': {
      opacity: 1
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

export default AnimatedNetworkGroup;
