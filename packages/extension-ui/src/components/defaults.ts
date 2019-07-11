// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

const DANGER_COLOR = '#c00';
const LABEL_COLOR = '#878786';
const LINK_COLOR = '#3367d6';
const TEXT_COLOR = '#4d4e4f';

const defaults = {
  borderRadius: '0.25rem',
  btnBg: TEXT_COLOR, // LINK_COLOR,
  btnBgDanger: DANGER_COLOR,
  btnBorder: `0 solid `,
  btnColor: '#f5f6f7',
  btnColorDanger: '#f5f6f7',
  btnPadding: '0.75rem 1rem',
  boxBorder: 'none', // '0.25rem solid #e2e1e0',
  boxMargin: '0.75rem 0',
  boxPadding: '0 0.25rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  color: TEXT_COLOR,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '1rem',
  hdrBg: 'transparent', // '#f5f6f7',
  hdrColor: LABEL_COLOR,
  inputBorder: '#ccc',
  inputPadding: '0.5rem 0.75rem',
  inputPaddingLabel: '1.25rem 0.75rem 0.5rem',
  labelColor: LABEL_COLOR,
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
      background: '#fff6cb',
      border: '#e7c000',
      color: '#6b5900'
    }
  }
};

export default defaults;
