// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

const darkTheme = {
  id: 'dark',
  background: '#181A23',
  highlightedAreaBackground: '#0B0C10',
  popupBackground: '#0B0C10',
  accountBackground: '#0B0C10',
  buttonBackground: '#E37E06',
  buttonBackgroundHover: '#ED9329',
  buttonBackgroundDanger: '#D92A2A',
  buttonBackgroundDangerHover: '#D93B3B',
  buttonTextColor: '#FFFFFF',
  textColor: '#FFFFFF',
  subTextColor: '#FFFFFF',
  textColorDanger: '#FF5858',
  errorBorderColor: '#7E3530',
  errorColor: '#E42F2F',
  primaryColor: '#FF7D01',
  inputBackground: '#111218',
  inputBorderColor: '#2F313C',
  readonlyInputBackground: '#000000',
  boxBorderColor: '#222222',
  identiconBackground: '#F4F5F8',
  accountDotsIconColor: '#8E8E8E',
  iconWarningColor: '#FF7D01',
  iconDangerColor: '#FF5858',
  iconNeutralColor: '#8E8E8E',
  labelColor: '#9F9E99',
  boxShadow: 'rgba(0, 0, 0, 0.86)',
  fontFamily: 'Nunito, sans-serif',
  fontSize: '16px',
  lineHeight: '26px',
  labelFontSize: '13px',
  labelLineHeight: '18px',
  borderRadius: '4px',
  boxMargin: '0.75rem 0',
  boxPadding: '0 0.25rem'
};

const lightTheme: Theme = {
  ...darkTheme,
  id: 'light',
  background: '#FFFFFF',
  highlightedAreaBackground: '#F4F5F7',
  accountBackground: '#FFFFFF',
  popupBackground: '#FFFFFF',
  textColor: '#242529',
  subTextColor: '#747882',
  errorBorderColor: '#E42F2F',
  inputBackground: '#F4F5F8',
  inputBorderColor: '#DDE1EB',
  readonlyInputBackground: '#F4F5F8',
  boxBorderColor: '#DADFEA',
  iconNeutralColor: '#939CB1',
  labelColor: '#747882',
  boxShadow: 'rgba(0, 0, 0, 0.06)'
};

export function chooseTheme (): AvailableThemes {
  const preferredTheme = localStorage.getItem('theme');
  if (preferredTheme) {
    return preferredTheme === 'dark' ? 'dark' : 'light';
  }
  const isDarkColorSchemePreferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDarkColorSchemePreferred ? 'dark' : 'light';
}

export declare type Theme = typeof darkTheme;

export const themes = {
  dark: darkTheme,
  light: lightTheme
};

export declare type AvailableThemes = keyof typeof themes;
