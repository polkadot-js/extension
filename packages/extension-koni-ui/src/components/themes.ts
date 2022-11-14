// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import subspaceLogo from '@subwallet/extension-koni-ui/assets/logo/46.Subspace.png';
import subWalletLogo from '@subwallet/extension-koni-ui/assets/sub-wallet-logo.svg';

const basicThemeColors = {
  primary1: '#004BFF',
  primary2: '#42C59A'
};

const darkTheme = {
  id: 'dark',
  name: 'Dark',
  group: 'dark',
  HomeNavHighlightColor: basicThemeColors.primary2,
  accountAuthorizeRequest: '#151A30',
  accountBackground: '#1A1B20',
  accountDotsIconColor: '#8E8E8E',
  accountHoverBackground: 'rgba(255, 255, 255, 0.05)',
  addAccountImageBackground: '#1A1B20',
  backButtonBackground: '#3A3B41',
  backButtonBackgroundHover: '#3a3b41ad',
  backButtonTextColor: '#FFFFFF',
  backDropColor: 'rgba(255, 255, 255, 0.5)',
  background: '#010414',
  backgroundAccountAddress: '#262C4A',
  backgroundDropdownSelection: 'rgba(0, 7, 45, .7)',
  backgroundItemColor: 'rgba(255, 255, 255, 0.05)',
  bodyColor: '#20222A',
  borderColor2: '#212845',
  borderColor: '#EEEEEE',
  borderQr: '#FFF',
  borderRadius: '3px',
  boxBorderColor: '#212845',
  boxMargin: '0.75rem 0',
  boxPadding: '0 0.25rem',
  boxShadow2: '0px 0px 7px rgba(4, 193, 183, 0.4)',
  boxShadow: 'rgba(0, 0, 0, 0.86)',
  buttonBackground1: '#181E42',
  buttonBackground2: basicThemeColors.primary2,
  buttonBackground: basicThemeColors.primary1,
  buttonBackgroundDanger: '#AF1111',
  buttonBackgroundDangerHover: '#D93B3B',
  buttonBackgroundHover: '#ED9329',
  buttonBorderColor: 'rgb(66, 197, 154, 0.2)',
  buttonSetting: '#004BFF',
  buttonTextColor2: basicThemeColors.primary2,
  buttonTextColor3: '#00072D',
  buttonTextColor: '#FFFFFF',
  buyServiceOpacity: 0.6,
  chainBackgroundColor: 'rgba(237, 132, 61, 0.2)',
  chainTextColor: '#ED843D',
  checkDotColor: basicThemeColors.primary1,
  checkboxBorderColor: 'rgba(145, 150, 171, 0.3)',
  checkboxColor: '#262C4A',
  crowdloanActiveStatus: '#F7A21B',
  crowdloanFailStatus: '#F5000E',
  crowdloanWinnerStatus: '#42C59A',
  dangerBackgroundColor: 'rgba(175, 17, 17, 0.25)',
  dropdownBackground: '#020412',
  errorBorderColor: '#7E3530',
  errorColor: '#E42F2F',
  extensionBorder: '#030E45',
  filterDefault: 'invert(51%) sepia(13%) saturate(545%) hue-rotate(192deg) brightness(96%) contrast(85%)', // #7B8098
  filterError: 'invert(22%) sepia(85%) saturate(4711%) hue-rotate(351deg) brightness(98%) contrast(82%)', // #FF8686
  filterSuccess: 'invert(71%) sepia(58%) saturate(424%) hue-rotate(107deg) brightness(85%) contrast(90%)', // #42C59A
  filterWarning: 'invert(77%) sepia(67%) saturate(6392%) hue-rotate(0deg) brightness(103%) contrast(105%)', // #FF7D01
  filterWhite: 'invert(100%) sepia(0%) saturate(25%) hue-rotate(70deg) brightness(108%) contrast(108%)', // #FFFFFF
  fontFamily: 'Lexend',
  fontSize2: '15px',
  fontSize3: '13px',
  fontSize: '16px',
  headerBoxShadow: '0px 5px 40px #051258',
  highlightedAreaBackground: '#EFEFEF',
  iconDangerColor: '#AF1111',
  iconHoverColor: basicThemeColors.primary2,
  iconNeutralColor: '#7B8098',
  iconWarningColor: '#FF7D01',
  identiconBackground: '#F4F5F8',
  inputBackground: '#111218',
  inputBorderColor: '#2D365C',
  inputLabelFontSize: '14px',
  labelColor: '#9F9E99',
  labelDarkThemeColor: '#FFFFFF',
  labelFontSize: '15px',
  labelLightThemeColor: '#9196AB',
  labelLineHeight: '26px',
  lineHeight2: '24px',
  lineHeight: '26px',
  loadingBackground1: '#181E42',
  loadingBackground2: basicThemeColors.primary2,
  logo: subWalletLogo,
  manageWebsiteAccessColor: '#9196AB',
  menuBoxShadow: '0px 0px 7px rgba(4, 193, 183, 0.4)',
  menuItemsBorder: '#262C4A',
  overlayBackground: '#00072D',
  parentLabelColor: '#4A7463',
  popupBackground: '#181E42',
  primaryColor: basicThemeColors.primary2,
  readonlyInputBackground: 'rgba(38, 44, 74, 0.4)',
  scrollBarThumb: 'rgba(128, 135, 139, .8)',
  scrollBarThumbHover: '#9196AB',
  scrollBarThumbInactive: 'rgba(145, 150, 171, .5)',
  secondaryColor: basicThemeColors.primary1,
  subTextColor: '#DDD',
  tabContentBorderBottomColor: '#343849',
  textColor2: '#7B8098',
  textColor3: basicThemeColors.primary2,
  textColor: '#FFFFFF',
  textColorDanger: '#FF8686',
  textColorFilter2: 'invert(55%) sepia(15%) saturate(461%) hue-rotate(192deg) brightness(89%) contrast(88%)',
  textDark: '#000000',
  textOpacity: 0.6,
  textSettingButton: '#EEEEEE',
  toggleInactiveBgc: '#262C4A',
  toggleInactiveThumbBoxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
  toggleInactiveThumbColor: '#9196AB',
  uploadFileBorderColor: 'rgba(0, 75, 255, 0.2)',
  warningBackgroundColor: 'rgba(231, 185, 23, 0.2)'
};

export declare type Theme = typeof darkTheme;

const lightTheme: Theme = {
  ...darkTheme,
  id: 'light',
  name: 'Light',
  group: 'light',
  // buttonTextColor2: basicThemeColors.color1,
  HomeNavHighlightColor: basicThemeColors.primary2,
  accountAuthorizeRequest: '#F5F5F5',
  accountBackground: '#FFFFFF',
  accountHoverBackground: '#f2f3f4',
  addAccountImageBackground: '#FFF',
  backButtonBackground: '#D7D7D7',
  backButtonBackgroundHover: '#d7d7d7ad',
  backButtonTextColor: '#454545',
  backDropColor: 'rgba(0, 0, 0, 0.5)',
  background: '#FFFFFF',
  backgroundAccountAddress: '#F5F5F5',
  backgroundDropdownSelection: 'rgba(0,0,0,.03)',
  backgroundItemColor: 'rgba(255, 255, 255, 0.05)',
  bodyColor: '#FFFFFF',
  borderColor2: '#EEEEEE',
  boxBorderColor: '#EEEEEE',
  boxShadow2: '0px 0px 5px rgba(0, 0, 0, 0.05), 0px 20px 60px rgba(0, 0, 0, 0.15)',
  boxShadow: 'rgba(0, 0, 0, 0.3)',
  buttonBackground1: '#F0F4FF',
  buttonBackgroundDanger: '#B5131C',
  checkboxBorderColor: '#DDDDDD',
  checkboxColor: '#F5F5F5',
  dangerBackgroundColor: 'rgba(175, 17, 17, 0.1)',
  dropdownBackground: '#020412',
  errorBorderColor: '#E42F2F',
  extensionBorder: '#EDEDED',
  headerBoxShadow: '0px 10px 40px rgba(0, 0, 0, 0.08)',
  highlightedAreaBackground: '#212226',
  iconDangerColor: '#DC2222',
  iconNeutralColor: '#939CB1',
  inputBackground: '#FFFFFF',
  inputBorderColor: '#EDEDED',
  labelColor: '#333333',
  labelDarkThemeColor: '#666666',
  labelLightThemeColor: '#00072D',
  loadingBackground1: '#F0F4FF',
  loadingBackground2: basicThemeColors.primary1,
  manageWebsiteAccessColor: '#666666',
  menuBoxShadow: '0px 0px 5px rgba(0, 0, 0, 0.05), 0px 20px 60px rgba(0, 0, 0, 0.15)',
  menuItemsBorder: '#EEEEEE',
  overlayBackground: '#FFFFFF',
  parentLabelColor: '#215B4F',
  popupBackground: '#FFFFFF',
  readonlyInputBackground: '#DDD',
  scrollBarThumb: 'rgba(0, 0, 0, .25)',
  subTextColor: '#454545',
  tabContentBorderBottomColor: 'transparent',
  textColor2: '#888888',
  textColor3: basicThemeColors.primary1,
  textColor: '#00072D',
  textColorDanger: '#F24A4A',
  toggleInactiveBgc: '#ddd',
  toggleInactiveThumbBoxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
  toggleInactiveThumbColor: '#fff',
  warningBackgroundColor: 'rgba(231, 185, 23, 0.1)'
};

interface GenerateOptions extends Partial<Theme> {
  primaryColor: string,
  secondaryColor: string
}

export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme
};

function generateTheme (id: string, name: string, baseTheme: 'dark' | 'light', options: GenerateOptions) {
  themes[id] = {
    ...themes[baseTheme],
    id,
    name,
    HomeNavHighlightColor: baseTheme === 'dark' ? options.secondaryColor : options.primaryColor,
    buttonBackground2: options.secondaryColor,
    buttonBackground: options.primaryColor,
    buttonTextColor2: options.secondaryColor,
    checkDotColor: options.primaryColor,
    iconHoverColor: options.secondaryColor,
    loadingBackground2: baseTheme === 'dark' ? options.secondaryColor : options.primaryColor,
    textColor3: baseTheme === 'dark' ? options.secondaryColor : options.primaryColor,
    ...options
  };
}

// Generate Subspace theme
generateTheme('subspace', 'Subspace', 'light', {
  buttonSetting: '#562B8E',
  buttonTextColor3: '#FFFFFF',
  logo: subspaceLogo,
  primaryColor: '#562B8E',
  secondaryColor: '#562B8E'
});

export declare type AvailableThemes = keyof typeof themes;

export function chooseTheme (): AvailableThemes {
  const preferredTheme = localStorage.getItem('theme') as string;

  if (themes[preferredTheme]) {
    return preferredTheme;
  }

  return 'dark';
}

export function getThemeOptions (): Array<{ value: string, text: string }> {
  return Object.values(themes).map((v) => ({ text: v.name, value: v.id }));
}
