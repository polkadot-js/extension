// [object Object]
// SPDX-License-Identifier: Apache-2.0

import styled from 'styled-components';

import Component, { Props } from './SideMenu';

const SideMenu = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '&.__expanded': {
    width: 250,

    '.ant-menu-item': {
      padding: '16px 26px',

      '.ant-menu-item-icon': {
        marginRight: 0
      }
    },

    '.logo-container': {
      '& > svg': {
        width: 50,
        height: 70
      }
    },

    '.menu-wrapper': {
      marginTop: 30
    }
  },

  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: '#1A1A1A',
  transition: 'width .8s',
  width: 50,

  '.flex-col': {
    display: 'flex',
    flexDirection: 'column'
  },

  '.logo-container': {
    paddingTop: `${token.paddingXXL - 8}px`,
    display: 'flex',
    justifyContent: 'center',

    '& > svg': {
      transition: 'width .8s, height .8s',
      width: 20,
      height: 30
    }
  },

  '.menu-wrapper': {
    marginTop: 65,
    justifyContent: 'space-between',
    height: '100%',
    transition: 'margin .8s',

    '.ant-menu-item': {
      backgroundColor: '#1A1A1A',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      padding: 16,
      height: 52,
      margin: 0,
      opacity: 0.65,
      borderRadius: 0,

      '.ant-menu-item-icon': {
        minHeight: 20,
        minWidth: 20,
        marginRight: 5
      }
    },

    '.ant-menu-item-selected': {
      borderRight: `4px solid ${token.colorPrimary}`,

      '.ant-menu-item-icon': {
        color: token.colorPrimary
      },

      '.ant-menu-title-content': {
        color: 'white',
        background: 'transparent'
      }
    }
  }
}));

export default SideMenu;
