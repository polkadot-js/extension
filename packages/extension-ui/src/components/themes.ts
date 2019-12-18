// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

const darkTheme = {
  id: 'dark',
  background: '#26272C',
  bodyColor: '#20222A',
  highlightedAreaBackground: '#212226',
  popupBackground: '#38393F',
  accountBackground: '#1A1B20',
  buttonBackground: '#E86F00',
  buttonBackgroundHover: '#ED9329',
  buttonBackgroundDanger: '#AF1111',
  buttonBackgroundDangerHover: '#D93B3B',
  buttonTextColor: '#FFFFFF',
  textColor: '#FFFFFF',
  subTextColor: '#DDD',
  textColorDanger: '#FF8686',
  errorBorderColor: '#7E3530',
  errorColor: '#E42F2F',
  primaryColor: '#FF7D01',
  inputBackground: '#111218',
  inputBorderColor: '#43444B',
  readonlyInputBackground: '#1A1B20',
  boxBorderColor: '#43444B',
  identiconBackground: '#F4F5F8',
  accountDotsIconColor: '#8E8E8E',
  iconWarningColor: '#FF7D01',
  iconDangerColor: '#AF1111',
  iconNeutralColor: '#8E8E8E',
  labelColor: '#9F9E99',
  addAccountImageBackground: '#1A1B20',
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
  background: '#FAFAFA',
  bodyColor: '#FFFFFF',
  highlightedAreaBackground: '#EFEFEF',
  accountBackground: '#FFFFFF',
  popupBackground: '#FFFFFF',
  textColor: '#242529',
  subTextColor: '#454545',
  errorBorderColor: '#E42F2F',
  textColorDanger: '#F24A4A',
  buttonBackgroundDanger: '#DC2222',
  iconDangerColor: '#DC2222',
  inputBackground: '#FFFFFF',
  inputBorderColor: '#DDE1EB',
  readonlyInputBackground: '#FFF',
  boxBorderColor: '#DADFEA',
  iconNeutralColor: '#939CB1',
  labelColor: '#333333',
  addAccountImageBackground: '#FFF',
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
