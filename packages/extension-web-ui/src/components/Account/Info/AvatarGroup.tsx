// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { isAccountAll } from '@subwallet/extension-web-ui/utils';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

export interface BaseAccountInfo {
  address: string;
  name?: string;
  type?: KeypairType;
}

interface Props extends ThemeProps {
  accounts?: Array<BaseAccountInfo>;
}

const sizeAva = {
  default: 20,
  large: 24
};

const Component: React.FC<Props> = ({ accounts: _accounts, className }: Props) => {
  const accounts = useSelector((state: RootState) => state.accountState.accounts);
  const noAllAccount: BaseAccountInfo[] = useMemo((): BaseAccountInfo[] => {
    return (_accounts || accounts).filter((account) => !isAccountAll(account.address));
  }, [accounts, _accounts]);

  const showCount: number = useMemo((): number => {
    return noAllAccount.length > 2 ? 3 : 2;
  }, [noAllAccount]);

  const countMore: number = useMemo((): number => {
    return noAllAccount.length - 3;
  }, [noAllAccount]);

  return (
    <div className={className}>
      <div className={CN('content-container', { 'ml-strong': countMore > 0 })}>
        {
          noAllAccount.slice(0, 3).map((account, index) => {
            return (
              <div
                className={CN(
                  'avatar-content',
                  {
                    'avatar-blur': index === 2 && countMore > 0
                  }
                )}
                key={account.address}
              >
                <SwAvatar
                  identPrefix={42}
                  size={showCount === 3 ? sizeAva.default : sizeAva.large}
                  value={account.address}
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

const AvatarGroup = styled(Component)<Props>(({ theme }: Props) => {
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

export default AvatarGroup;
