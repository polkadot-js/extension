// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

const TEXT_COLOR = '#4e4e4e';
const LABEL_COLOR = 'rgba(78, 78, 78, 0.75)';
const LINK_COLOR = '#3367d6';

const defaults: { [index: string]: any } = {
  borderRadius: '0.25rem',
  btnBg: '#fff',
  btnBorder: `2px solid ${LINK_COLOR}`,
  btnColor: LINK_COLOR, // '#fefefe',
  btnPadding: '0.75rem 1rem',
  boxMargin: '0.75rem 0',
  boxPadding: '0 0.25rem',
  color: TEXT_COLOR,
  colorLabel: LABEL_COLOR,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '1rem',
  hdrBg: 'transparent',
  hdrColor: '#ccc',
  inputBorder: '#ccc',
  inputPadding: '0.5rem 0.75rem',
  lineHeight: '1.25',
  linkColor: LINK_COLOR,
  box: {
    error: {
      background: '#ffe6e6',
      border: '#c00',
      color: '#4d0000'
    },
    info: {
      background: '#fafafa',
      border: TEXT_COLOR,
      color: 'inherit'
    },
    success: {
      background: '#f3f5f7',
      border: '#42b983',
      color: 'inherit'
    },
    warn: {
      background: 'rgba(255, 229, 100, .3)',
      border: '#e7c000',
      color: '#6b5900'
    }
  }
};

export default defaults;
