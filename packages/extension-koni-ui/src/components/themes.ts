// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

const colors = {
  primary1: '#004BFF',
  primary2: '#04C1B7'
};

const darkTheme = {
  accountBackground: '#1A1B20',
  accountDotsIconColor: '#8E8E8E',
  addAccountImageBackground: '#1A1B20',
  backButtonBackground: '#3A3B41',
  backButtonBackgroundHover: '#3a3b41ad',
  backButtonTextColor: '#FFFFFF',
  backDropColor: 'rgba(0, 0, 0, 0.5)',
  background: '#010414',
  backgroundAccountAddress: '#262C4A',
  backgroundDropdownSeclection: 'rgba(0, 7, 45, .7)',
  bodyColor: '#20222A',
  borderRadius: '3px',
  boxBorderColor: '#343849',
  borderColor: '#EEEEEE',
  boxMargin: '0.75rem 0',
  boxPadding: '0 0.25rem',
  boxShadow: 'rgba(0, 0, 0, 0.86)',
  boxShadow2: '0px 0px 7px rgba(4, 193, 183, 0.4)',
  buttonBackground: colors.primary1,
  buttonBackground2: colors.primary2,
  buttonBackgroundDanger: '#AF1111',
  buttonBackground1: '#181E42',
  buttonBackgroundDangerHover: '#D93B3B',
  buttonBackgroundHover: '#ED9329',
  buttonTextColor: '#FFFFFF',
  buttonTextColor2: colors.primary2,
  buttonTextColor3: '#00072D',
  tabContentBorderBottomColor: '#343849',
  errorBorderColor: '#7E3530',
  errorColor: '#E42F2F',
  fontFamily: 'Lexend',
  fontSize: '16px',
  fontSize2: '15px',
  fontSize3: '13px',
  highlightedAreaBackground: '#EFEFEF',
  headerBoxShadow: '0px 5px 40px #030d42',
  iconDangerColor: '#AF1111',
  iconNeutralColor: 'rgba(136, 136, 136, 0.8)',
  iconWarningColor: '#FF7D01',
  id: 'dark',
  identiconBackground: '#F4F5F8',
  inputBackground: '#111218',
  inputBorderColor: '#161934',
  uploadFileBorderColor: 'rgba(0, 75, 255, 0.2)',
  inputLabelFontSize: '14px',
  labelColor: '#9F9E99',
  backgroundItemColor: 'rgba(255, 255, 255, 0.05)',
  labelFontSize: '15px',
  labelLineHeight: '26px',
  lineHeight: '26px',
  lineHeight2: '24px',
  menuBoxShadow: '0px 0px 7px rgba(4, 193, 183, 0.4)',
  menuItemsBorder: '#262C4A',
  parentLabelColor: '#4A7463',
  overlayBackground: '#00072D',
  popupBackground: '#181E42',
  accountHoverBackground: 'rgba(255, 255, 255, 0.05)',
  primaryColor: '#FF7D01',
  readonlyInputBackground: '#1A1B20',
  warningBackgroundColor: 'rgba(231, 185, 23, 0.2)',
  dangerBackgroundColor: 'rgba(175, 17, 17, 0.25)',
  subTextColor: '#DDD',
  textColor: '#FFFFFF',
  textColor2: '#9196AB',
  textColor3: colors.primary2,
  textColorDanger: '#FF8686',
  checkDotColor: colors.primary1,
  iconHoverColor: colors.primary2,
  chainTextColor: '#ED843D',
  chainBackgroundColor: 'rgba(237, 132, 61, 0.2)',
  checkboxColor: '#262C4A',
  checkboxBorderColor: 'rgba(145, 150, 171, 0.3)',
  labelLightThemeColor: '#9196AB',
  labelDarkThemeColor: '#FFFFFF',
  manageWebsiteAccessColor: '#9196AB',
  loadingBackground1: '#181E42',
  loadingBackground2: colors.primary2,
  toggleInactiveBgc: '#262C4A',
  toggleInactiveThumbColor: '#9196AB',
  toggleInactiveThumbBoxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
  scrollBarThumb: 'rgba(128, 135, 139, .8)',
  scrollBarThumbInactive: 'rgba(145, 150, 171, .5)',
  scrollBarThumbHover: '#9196AB',
};

export declare type Theme = typeof darkTheme;

const lightTheme: Theme = {
  ...darkTheme,
  accountBackground: '#FFFFFF',
  addAccountImageBackground: '#FFF',
  backButtonBackground: '#D7D7D7',
  backButtonBackgroundHover: '#d7d7d7ad',
  backButtonTextColor: '#454545',
  backDropColor: 'rgba(255, 255, 255, 0.5)',
  background: '#FFFFFF',
  backgroundAccountAddress: '#F5F5F5',
  backgroundDropdownSeclection: 'rgba(0,0,0,.03)',
  bodyColor: '#FFFFFF',
  boxBorderColor: '#EEEEEE',
  boxShadow: 'rgba(0, 0, 0, 0.3)',
  boxShadow2: '0px 0px 5px rgba(0, 0, 0, 0.05), 0px 20px 60px rgba(0, 0, 0, 0.15)',
  buttonBackground1: '#F0F4FF',
  buttonBackgroundDanger: '#B5131C',
  // buttonTextColor2: colors.primary1,
  tabContentBorderBottomColor: 'transparent',
  checkboxColor: '#F5F5F5',
  checkboxBorderColor: '#DDDDDD',
  errorBorderColor: '#E42F2F',
  highlightedAreaBackground: '#212226',
  headerBoxShadow: '0px 10px 40px rgba(0, 0, 0, 0.08)',
  overlayBackground: '#FFFFFF',
  iconDangerColor: '#DC2222',
  iconNeutralColor: '#939CB1',
  id: 'light',
  inputBackground: '#FFFFFF',
  inputBorderColor: '#DDE1EB',
  labelColor: '#333333',
  menuBoxShadow: '0px 0px 5px rgba(0, 0, 0, 0.05), 0px 20px 60px rgba(0, 0, 0, 0.15)',
  menuItemsBorder: '#EEEEEE',
  backgroundItemColor: 'rgba(255, 255, 255, 0.05)',
  parentLabelColor: '#215B4F',
  popupBackground: '#FFFFFF',
  accountHoverBackground: '#f2f3f4',
  readonlyInputBackground: '#FFF',
  subTextColor: '#454545',
  textColor: '#00072D',
  textColor2: '#666666',
  textColor3: colors.primary1,
  textColorDanger: '#F24A4A',
  labelLightThemeColor: '#00072D',
  labelDarkThemeColor: '#666666',
  manageWebsiteAccessColor: '#666666',
  warningBackgroundColor: 'rgba(231, 185, 23, 0.1)',
  dangerBackgroundColor: 'rgba(175, 17, 17, 0.1)',
  loadingBackground1: '#F0F4FF',
  loadingBackground2: colors.primary1,
  toggleInactiveBgc: '#ddd',
  toggleInactiveThumbColor: '#fff',
  toggleInactiveThumbBoxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
  scrollBarThumb: 'rgba(0, 0, 0, .25)',
};

export const themes = {
  dark: darkTheme,
  light: lightTheme
};

export declare type AvailableThemes = keyof typeof themes;

export function chooseTheme (): AvailableThemes {
  const preferredTheme = localStorage.getItem('theme');

  if (preferredTheme) {
    return preferredTheme === 'dark'
      ? 'dark'
      : 'light';
  }

  // return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
  //   ? 'light'
  //   : 'dark';

  return 'dark';
}
