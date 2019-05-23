// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

const DANGER_COLOR = '#c00';
const LABEL_COLOR = 'rgba(78, 78, 78, 0.75)';
const LINK_COLOR = '#3367d6';
const TEXT_COLOR = '#4e4e4e';

const defaults: { [index: string]: any } = {
  borderRadius: '0.25rem',
  btnBg: '#fff',
  btnBorder: `2px solid `,
  btnColor: LINK_COLOR,
  btnColorDanger: DANGER_COLOR,
  btnPadding: '0.75rem 1rem',
  boxMargin: '0.75rem 0',
  boxPadding: '0 0.25rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  color: TEXT_COLOR,
  colorLabel: LABEL_COLOR,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '1rem',
  hdrBg: '#e2e1e0',
  hdrColor: '#878786',
  inputBorder: '#ccc',
  inputPadding: '0.5rem 0.75rem',
  lineHeight: '1.25',
  linkColor: LINK_COLOR,
  linkColorDanger: DANGER_COLOR,
  box: {
    error: {
      background: '#ffe6e6',
      border: DANGER_COLOR,
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
