// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// import subspaceLogo from '@subwallet/extension-koni-ui/assets/logo/subspace.png';
import subWalletLogo from '@subwallet/extension-koni-ui/assets/sub-wallet-logo.svg';

const basicThemeColors = {
  color1: '#004BFF',
  color2: '#42C59A'
};

const darkTheme = {
  logo: subWalletLogo,
  primaryColor: basicThemeColors.color2,
  secondaryColor: basicThemeColors.color1,
  accountBackground: '#1A1B20',
  accountDotsIconColor: '#8E8E8E',
  addAccountImageBackground: '#1A1B20',
  backButtonBackground: '#3A3B41',
  backButtonBackgroundHover: '#3a3b41ad',
  backButtonTextColor: '#FFFFFF',
  backDropColor: 'rgba(255, 255, 255, 0.5)',
  background: '#010414',
  backgroundAccountAddress: '#262C4A',
  backgroundDropdownSelection: 'rgba(0, 7, 45, .7)',
  bodyColor: '#20222A',
  borderRadius: '3px',
  boxBorderColor: '#212845',
  borderColor: '#EEEEEE',
  borderColor2: '#212845',
  boxMargin: '0.75rem 0',
  boxPadding: '0 0.25rem',
  boxShadow: 'rgba(0, 0, 0, 0.86)',
  boxShadow2: '0px 0px 7px rgba(4, 193, 183, 0.4)',
  buttonBackground: basicThemeColors.color1,
  buttonBackground2: basicThemeColors.color2,
  buttonBorderColor: 'rgb(66, 197, 154, 0.2)',
  buttonBackgroundDanger: '#AF1111',
  buttonBackground1: '#181E42',
  buttonBackgroundDangerHover: '#D93B3B',
  buttonBackgroundHover: '#ED9329',
  buttonTextColor: '#FFFFFF',
  buttonTextColor2: basicThemeColors.color2,
  buttonTextColor3: '#00072D',
  tabContentBorderBottomColor: '#343849',
  errorBorderColor: '#7E3530',
  errorColor: '#E42F2F',
  fontFamily: 'Lexend',
  fontSize: '16px',
  fontSize2: '15px',
  fontSize3: '13px',
  highlightedAreaBackground: '#EFEFEF',
  headerBoxShadow: '0px 5px 40px #051258',
  iconDangerColor: '#AF1111',
  iconNeutralColor: '#7B8098',
  iconWarningColor: '#FF7D01',
  id: 'dark',
  name: 'Dark',
  HomeNavHighlightColor: basicThemeColors.color2,
  identiconBackground: '#F4F5F8',
  inputBackground: '#111218',
  inputBorderColor: '#2D365C',
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
  readonlyInputBackground: 'rgba(38, 44, 74, 0.4)',
  warningBackgroundColor: 'rgba(231, 185, 23, 0.2)',
  dangerBackgroundColor: 'rgba(175, 17, 17, 0.25)',
  subTextColor: '#DDD',
  textColor: '#FFFFFF',
  textColor2: '#7B8098',
  textColor3: basicThemeColors.color2,
  textColorDanger: '#FF8686',
  checkDotColor: basicThemeColors.color1,
  iconHoverColor: basicThemeColors.color2,
  chainTextColor: '#ED843D',
  chainBackgroundColor: 'rgba(237, 132, 61, 0.2)',
  checkboxColor: '#262C4A',
  checkboxBorderColor: 'rgba(145, 150, 171, 0.3)',
  labelLightThemeColor: '#9196AB',
  labelDarkThemeColor: '#FFFFFF',
  manageWebsiteAccessColor: '#9196AB',
  loadingBackground1: '#181E42',
  loadingBackground2: basicThemeColors.color2,
  toggleInactiveBgc: '#262C4A',
  toggleInactiveThumbColor: '#9196AB',
  toggleInactiveThumbBoxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
  scrollBarThumb: 'rgba(128, 135, 139, .8)',
  scrollBarThumbInactive: 'rgba(145, 150, 171, .5)',
  scrollBarThumbHover: '#9196AB',
  crowdloanWinnerStatus: '#42C59A',
  crowdloanActiveStatus: '#F7A21B',
  crowdloanFailStatus: '#F5000E',
  extensionBorder: '#030E45',
  accountAuthorizeRequest: '#151A30',
  dropdownBackground: '#020412',
  filterDefault: 'invert(51%) sepia(13%) saturate(545%) hue-rotate(192deg) brightness(96%) contrast(85%)',
  filterError: 'invert(22%) sepia(85%) saturate(4711%) hue-rotate(351deg) brightness(98%) contrast(82%)',
  filterSuccess: 'invert(71%) sepia(58%) saturate(424%) hue-rotate(107deg) brightness(85%) contrast(90%)',
  filterWarning: 'invert(77%) sepia(67%) saturate(6392%) hue-rotate(0deg) brightness(103%) contrast(105%)'
};

export declare type Theme = typeof darkTheme;

const lightTheme: Theme = {
  ...darkTheme,
  accountBackground: '#FFFFFF',
  addAccountImageBackground: '#FFF',
  backButtonBackground: '#D7D7D7',
  backButtonBackgroundHover: '#d7d7d7ad',
  backButtonTextColor: '#454545',
  backDropColor: 'rgba(0, 0, 0, 0.5)',
  background: '#FFFFFF',
  backgroundAccountAddress: '#F5F5F5',
  backgroundDropdownSelection: 'rgba(0,0,0,.03)',
  bodyColor: '#FFFFFF',
  borderColor2: '#EEEEEE',
  boxBorderColor: '#EEEEEE',
  boxShadow: 'rgba(0, 0, 0, 0.3)',
  boxShadow2: '0px 0px 5px rgba(0, 0, 0, 0.05), 0px 20px 60px rgba(0, 0, 0, 0.15)',
  buttonBackground1: '#F0F4FF',
  buttonBackgroundDanger: '#B5131C',
  // buttonTextColor2: basicThemeColors.color1,
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
  name: 'Light',
  HomeNavHighlightColor: basicThemeColors.color2,
  inputBackground: '#FFFFFF',
  inputBorderColor: '#EDEDED',
  labelColor: '#333333',
  menuBoxShadow: '0px 0px 5px rgba(0, 0, 0, 0.05), 0px 20px 60px rgba(0, 0, 0, 0.15)',
  menuItemsBorder: '#EEEEEE',
  backgroundItemColor: 'rgba(255, 255, 255, 0.05)',
  parentLabelColor: '#215B4F',
  popupBackground: '#FFFFFF',
  accountHoverBackground: '#f2f3f4',
  readonlyInputBackground: '#DDD',
  subTextColor: '#454545',
  textColor: '#00072D',
  textColor2: '#888888',
  textColor3: basicThemeColors.color1,
  textColorDanger: '#F24A4A',
  labelLightThemeColor: '#00072D',
  labelDarkThemeColor: '#666666',
  manageWebsiteAccessColor: '#666666',
  warningBackgroundColor: 'rgba(231, 185, 23, 0.1)',
  dangerBackgroundColor: 'rgba(175, 17, 17, 0.1)',
  loadingBackground1: '#F0F4FF',
  loadingBackground2: basicThemeColors.color1,
  toggleInactiveBgc: '#ddd',
  toggleInactiveThumbColor: '#fff',
  toggleInactiveThumbBoxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
  scrollBarThumb: 'rgba(0, 0, 0, .25)',
  extensionBorder: '#EDEDED',
  accountAuthorizeRequest: '#F5F5F5',
  dropdownBackground: '#020412'
};

// interface GenerateOptions extends Partial<Theme> {
//   primaryColor: string,
//   secondaryColor: string
// }

export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme
};

// function generateTheme (id: string, name: string, baseTheme: 'dark' | 'light', options: GenerateOptions) {
//   themes[id] = {
//     ...themes[baseTheme],
//     id,
//     name,
//     buttonBackground: options.primaryColor,
//     buttonBackground2: options.secondaryColor,
//     buttonTextColor2: options.secondaryColor,
//     textColor3: baseTheme === 'dark' ? options.secondaryColor : options.primaryColor,
//     checkDotColor: options.primaryColor,
//     iconHoverColor: options.secondaryColor,
//     loadingBackground2: baseTheme === 'dark' ? options.secondaryColor : options.primaryColor,
//     HomeNavHighlightColor: baseTheme === 'dark' ? options.secondaryColor : options.primaryColor,
//     ...options
//   };
// }

// Generate Subspace theme
// generateTheme('subspace', 'Subspace', 'light', {
//   primaryColor: '#562B8E',
//   secondaryColor: '#562B8E',
//   logo: subspaceLogo
// });

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
