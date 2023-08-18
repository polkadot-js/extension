// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import styled from 'styled-components';

import Component, { Props } from './SideMenu';

const SideMenu = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  backgroundColor: token.colorBgSecondary,
  height: '100%',
  width: 248,
  flexDirection: 'column',
  display: 'flex',
  transition: `width ${token.motionDurationSlow} cubic-bezier(0.645, 0.045, 0.355, 1)`,

  '.__logo-container': {
    width: '100%',
    height: 156,
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    transition: `width ${token.motionDurationSlow} cubic-bezier(0.645, 0.045, 0.355, 1), padding ${token.motionDurationSlow} cubic-bezier(0.645, 0.045, 0.355, 1)`
  },

  '.__sidebar-collapse-trigger': {
    color: token.colorTextLight1,
    position: 'absolute',
    right: -20,
    top: 0,
    bottom: 0,
    marginTop: 'auto',
    marginBottom: 'auto',
    zIndex: 100,

    '.anticon': {
      borderRadius: '100%',
      backgroundColor: token.colorBgInput
    }
  },

  '.__menu-container': {
    flex: 1,
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'space-between'
  },

  '.ant-image': {
    transition: `height ${token.motionDurationSlow} cubic-bezier(0.645, 0.045, 0.355, 1),border-color ${token.motionDurationSlow}`
  },

  '.ant-image-img': {
    maxHeight: '100%'
  },

  '.ant-menu.ant-menu': {
    backgroundColor: 'transparent'
  },

  '.ant-menu-item': {
    borderRight: '4px solid transparent',
    margin: 0,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 0,

    '.ant-menu-item-icon': {
      fontSize: 24,
      height: 40,
      width: 40,
      minWidth: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: token.colorTextLight3
    }
  },

  '.ant-menu-vertical >.ant-menu-item': {
    height: 52
  },

  '.ant-menu-item.ant-menu-item': {
    overflow: 'hidden',
    transition: `width ${token.motionDurationSlow} cubic-bezier(0.645, 0.045, 0.355, 1),border-color ${token.motionDurationSlow},background ${token.motionDurationSlow},padding ${token.motionDurationSlow} cubic-bezier(0.645, 0.045, 0.355, 1)`
  },

  '.ant-menu-title-content.ant-menu-title-content': {
    lineHeight: token.lineHeight,
    fontWeight: token.headingFontWeight,
    marginLeft: token.marginXS,
    color: token.colorTextLight3
  },

  '.ant-menu-item:not(.ant-menu-item-selected):hover': {
    backgroundColor: token.colorBgInput,

    '.ant-menu-item-icon': {
      color: token.colorTextLight1
    },

    '.ant-menu-title-content.ant-menu-title-content': {
      color: token.colorTextLight1
    }
  },

  '.ant-menu-item.ant-menu-item-selected': {
    backgroundColor: 'transparent',
    borderRightColor: token.colorPrimary,

    '.ant-menu-item-icon': {
      color: token.colorPrimary
    },

    '.ant-menu-title-content.ant-menu-title-content': {
      color: token.colorTextLight1
    }
  },

  '&, &.-expanded': {
    width: 248,

    '.__logo-container': {
      paddingTop: 39
    },

    '.ant-image': {
      height: 69
    },

    '.ant-menu-item.ant-menu-item': {
      width: 248
    }
  },

  '&.-collapsed': {
    width: 52,

    '.__logo-container': {
      paddingTop: 24
    },

    '.ant-image': {
      height: 32
    },

    '.ant-menu-item.ant-menu-item': {
      paddingLeft: 6,
      paddingRight: 0,
      overflow: 'hidden',
      width: 52
    }
  }
}));

export default SideMenu;
