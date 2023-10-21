// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoWithState } from '@subwallet/extension-koni-ui/hooks/chain/useChainInfoWithState';
import { Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface NetworkGroupProps extends InfoItemBase {
  chains: ChainInfoWithState[]
  content: string;
  className: string
  onClick?: () => void
}

const Component: React.FC<NetworkGroupProps> = (props: NetworkGroupProps) => {
  const { chains,
    className, content, label, onClick } = props;

  const chainLogos = useMemo(() => {
    const countMore: number = chains.length - 3;

    return (
      <div className='chain-logos'>
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
                    network={chain.slug}
                    shape='circle'
                    size={14}
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
  }, [chains]
  );

  return (
    <div
      className={CN(className, '__row -type-account')}
      onClick={onClick}
    >
      {!!label && <div className={'__col __label-col'}>
        <div className={'__label'}>
          {label}
        </div>
      </div>}
      <div className={'__col __value-col -to-right'}>
        <div className={'__account-item __value -is-wrapper'}>
          {chainLogos}
          <div className={'__account-name ml-xs'}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

const NetworkGroupItem = styled(Component)<NetworkGroupProps>(({ theme: { token } }: NetworkGroupProps) => {
  return {
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
      position: 'relative',

      '.avatar-content': {
        marginLeft: -8,
        '.ant-image-img': {
          boxSizing: 'content-box',
          padding: 2,
          border: '1px solid #004BFF'
        }
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
      opacity: 0.5
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

export default NetworkGroupItem;
