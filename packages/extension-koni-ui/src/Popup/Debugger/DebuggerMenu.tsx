// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

type MenuProps = ThemeProps

type MenuItem = {
  name: string,
  url: string,
  subItems?: MenuItem[]
}

const MENU_DATA: MenuItem[] = [
  {
    url: '/',
    name: 'Root',
    subItems: [
      {
        url: '/welcome',
        name: 'welcome'
      },
      {
        url: '/home',
        name: 'home',
        subItems: [
          {
            url: '/home/tokens',
            name: 'tokens'
          },
          {
            url: '/home/nfts',
            name: 'nfts'
          },
          {
            url: '/home/crowdloans',
            name: 'crowdloans'
          },
          {
            url: '/home/staking',
            name: 'staking'
          },
          {
            url: '/home/history',
            name: 'history'
          }
        ]
      },
      {
        url: '/transaction',
        name: 'transaction',
        subItems: [
          {
            url: '/transaction/send-fund',
            name: 'send-fund'
          },
          {
            url: '/transaction/send-nft',
            name: 'send-nft'
          },
          {
            url: '/transaction/stake',
            name: 'stake'
          },
          {
            url: '/transaction/unstake',
            name: 'unstake'
          },
          {
            url: '/transaction/withdraw',
            name: 'withdraw'
          },
          {
            url: '/transaction/claim-reward',
            name: 'claim-reward'
          },
          {
            url: '/transaction/compound',
            name: 'compound'
          }
        ]
      },
      {
        url: '/account',
        name: 'account',
        subItems: [
          {
            url: '/account/account-list',
            name: 'account-list'
          },
          {
            url: '/account/add-account',
            name: 'add-account',
            subItems: [
              {
                url: '/account/add-account/from-seed',
                name: 'from-seed'
              },
              {
                url: '/account/add-account/derive',
                name: 'derive'
              },
              {
                url: '/account/add-account/from-json',
                name: 'from-json'
              },
              {
                url: '/account/add-account/attach-readonly',
                name: 'attach-readonly'
              },
              {
                url: '/account/add-account/attach-qr',
                name: 'attach-qr'
              }]
          }]
      },
      {
        name: 'setting',
        url: '/setting',
        subItems: [{
          name: 'list',
          url: '/setting/list'
        }, {
          name: 'general',
          url: '/setting/general'
        }, {
          name: 'dapp-access',
          url: '/setting/dapp-access'
        }, {
          name: 'dapp-access-edit',
          url: '/setting/dapp-access-edit'
        }, {
          name: 'network',
          url: '/setting/network'
        }, {
          name: 'network-edit',
          url: '/setting/network-edit'
        }, {
          name: 'token',
          url: '/setting/token'
        }, {
          name: 'master-password',
          url: '/setting/master-password'
        }]
      }
    ]
  }
];

interface MenuTreeProps {
  items: MenuItem[],
  className?: string
}

const Tree = function ({ className, items }: MenuTreeProps) {
  return <ul className={className}>
    {items.map(({ name, subItems, url }) => {
      return <li key={url}>
        <Link to={url}>{name}</Link>
        {subItems && <Tree items={subItems} />}
      </li>;
    })}
  </ul>;
};

const Component = ({ className }: MenuProps) => {
  const location = useLocation();

  return <div>
    <div>
      Current url: {location.pathname}
    </div>
    <Tree
      className={className}
      items={MENU_DATA}
    />
  </div>;
};

export const DebuggerMenu = styled(Component)<MenuProps>(({ theme }: ThemeProps) => {
  const token = theme.token;

  return {
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingRight: '16px',
    top: 0,
    margin: 0,
    width: '100%',
    transitionDuration: '0.3s',
    textAlign: 'left',

    '&, ul': {
      paddingLeft: token.sizeMD
    },

    li: {
      listStyle: 'none'
    },

    a: {
      color: '#fff'
    }
  };
});
