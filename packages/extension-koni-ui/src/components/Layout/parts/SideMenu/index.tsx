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
    opacity: 0,

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

  '.side-menu-item': {
    overflow: 'hidden',
    transition: `width ${token.motionDurationSlow} cubic-bezier(0.645, 0.045, 0.355, 1),border-color ${token.motionDurationMid},background-color ${token.motionDurationMid},padding ${token.motionDurationSlow} cubic-bezier(0.645, 0.045, 0.355, 1)`,

    '.__icon, .__label': {
      transition: `color ${token.motionDurationMid}`
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

    '.side-menu-item': {
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

    '.side-menu-item': {
      paddingLeft: 6,
      paddingRight: 0,
      overflow: 'hidden',
      width: 52
    }
  },

  '&:hover': {
    '.__sidebar-collapse-trigger': {
      opacity: 1
    }
  }
}));

export default SideMenu;
