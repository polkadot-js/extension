// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

const DANGER_COLOR = '#D92A2A';
const LABEL_COLOR = '#9F9E99';
const LINK_COLOR = '#9F9E99';
const TEXT_COLOR = '#FFFFFF';
const BG_COLOR = 'rgba(13, 14, 19, 0.9)';

export const defaultTheme = {
  background: BG_COLOR,
  borderRadius: '4px',
  btnAreaBackground: 'rgba(13, 14, 19, 0.7)',
  btnBg: 'linear-gradient(95.52deg, #FF8A00 0.14%, #FF7A00 100.14%)',
  btnBgDanger: DANGER_COLOR,
  btnBorder: '0 solid ',
  btnColor: TEXT_COLOR,
  btnColorDanger: TEXT_COLOR,
  btnPadding: '0.75rem 1rem',
  boxBorder: 'none', // '0.25rem solid #e2e1e0',
  boxMargin: '0.75rem 0',
  boxPadding: '0 0.25rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  color: TEXT_COLOR,
  fontFamily: 'Nunito, sans-serif',
  fontSize: '16px',
  hdrBg: 'transparent', // '#f5f6f7',
  hdrColor: LABEL_COLOR,
  inputBackground: 'rgba(13, 14, 19, 0.9)',
  readonlyInputBackground: '#000000',
  iconWarningColor: '#FF7D01',
  iconDangerColor: '#FF5858',
  identiconBackground: '#373737',
  inputBorder: '#303030',
  inputPadding: '0.5rem 0.75rem',
  inputPaddingLabel: '1.25rem 0.75rem 0.5rem',
  labelColor: LABEL_COLOR,
  labelFontSize: '13px',
  labelLineHeight: '18px',
  lineHeight: '26px',
  linkColor: LINK_COLOR,
  linkColorDanger: DANGER_COLOR,
  primaryColor: '#FF8301',
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

export declare type Theme = typeof defaultTheme;
