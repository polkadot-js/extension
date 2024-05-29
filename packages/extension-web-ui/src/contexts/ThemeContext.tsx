// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import applyPreloadStyle from '@subwallet/extension-web-ui/preloadStyle';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { generateTheme, SW_THEME_CONFIGS, SwThemeConfig } from '@subwallet/extension-web-ui/themes';
import { ConfigProvider, theme as reactUiTheme } from '@subwallet/react-ui';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { createGlobalStyle, ThemeProvider as StyledComponentThemeProvider } from 'styled-components';

import { Theme } from '../types';

interface Props {
  children: React.ReactNode;
  themeConfig: SwThemeConfig
}

const { useToken } = reactUiTheme;

const GlobalStyle = createGlobalStyle<ThemeProps>(({ theme }) => {
  const { extendToken, token } = theme as Theme;

  applyPreloadStyle(extendToken.bodyBackgroundColor);

  return ({
    body: {
      fontFamily: token.fontFamily,
      color: token.colorText,
      fontWeight: token.bodyFontWeight
    },
    pre: {
      fontFamily: 'inherit',
      whiteSpace: 'pre-wrap'
    },

    '.loading-icon': {
      fontSize: token.size
    },

    '.main-page-container': {
      border: `${token.lineWidth}px ${token.lineType} ${token.colorBgInput}`,
      boxSizing: 'border-box'
    },

    '.main-page-container.web-ui-enable': {
      border: 0
    },

    '.ant-sw-modal .ant-sw-modal-header': {
      borderRadius: '24px 24px 0 0'
    },

    '.ant-sw-modal': {
      '&, &.ant-sw-qr-scanner': {
        '.ant-sw-modal-content': {
          width: 390 - token.lineWidth * 2,
          left: token.lineWidth,
          bottom: 0,
          borderBottom: `1px solid ${token.colorBgInput}`
        }
      },

      '&.modal-full, &.ant-sw-qr-scanner': {
        '.ant-sw-modal-content': {
          top: 1,
          height: 600 - token.lineWidth * 2
        }
      }
    },
    '.web-confirmation': {
      '.ant-sw-modal-content': {
        padding: 0,
        '.ant-sw-modal-header': {
          borderRadius: 0
        }
      }
    },
    '.modal-full': {
      '.ant-sw-modal-content': {
        '.ant-sw-modal-header': {
          borderRadius: 0
        }
      }
    },
    '.general-modal.-mobile': {
      justifyContent: 'flex-end',
      '.ant-sw-modal-content': {
        maxHeight: '95%',
        width: '100%'
      }
    },
    '.__currency-value-detail-tooltip': {
      paddingBottom: 0,

      '.ant-tooltip-inner': {
        padding: `${token.paddingXXS}px ${token.paddingXXS + 2}px`,
        fontSize: token.fontSizeXS,
        minHeight: 'auto',
        minWidth: 'auto'
      },

      '.ant-tooltip-arrow': {
        transform: 'translateX(-50%) translateY(100%) rotate(180deg) scaleX(0.5)'
      }
    },
    '.text-secondary': {
      color: token.colorTextSecondary
    },

    '.text-tertiary': {
      color: token.colorTextTertiary
    },

    '.text-light-2': {
      color: token.colorTextLight2
    },

    '.text-light-4': {
      color: token.colorTextLight4
    },

    '.common-text': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },

    '.sm-text': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.lg-text': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG
    },

    '.mono-text': {
      fontFamily: token.monoSpaceFontFamily
    },

    '.ml-xs': {
      marginLeft: token.marginXS
    },

    '.mr-xs': {
      marginRight: token.marginXS
    },

    '.ml-xxs': {
      marginLeft: token.marginXXS
    },

    '.text-danger': {
      color: token.colorError
    },

    '.h3-text': {
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      fontWeight: token.headingFontWeight
    },

    '.h4-text': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: token.headingFontWeight
    },

    '.h5-text': {
      fontWeight: token.headingFontWeight,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
    },

    '.form-space-xs': {
      '.ant-form-item': {
        marginBottom: token.marginXS
      }
    },

    '.form-space-sm': {
      '.ant-form-item': {
        marginBottom: token.marginSM
      }
    },

    '.form-space-xxs': {
      '.ant-form-item': {
        marginBottom: token.marginXXS
      }
    },

    '.form-row': {
      display: 'flex',
      gap: token.sizeSM,

      '.ant-form-item': {
        flex: 1,
        overflow: 'hidden'
      }
    },

    '.item-disabled': {
      opacity: 0.4,
      cursor: 'not-allowed !important',
      backgroundColor: `${token.colorBgSecondary} !important`
    },

    '.mb-0': {
      marginBottom: 0
    },

    '.ant-checkbox': {
      top: 0
    },

    '.ant-notification-top': {
      '.ant-notification-notice': {
        marginInlineEnd: 'auto'
      }
    },

    '.ant-input-affix-wrapper': {
      overflow: 'hidden',

      '.ant-input': {
        overflow: 'hidden'
      },

      '.ant-input-suffix>span:last-child:empty': {
        marginRight: token.marginXS
      }
    },

    '.ant-tooltip-placement-bottom, .ant-tooltip-placement-bottomLeft, .ant-tooltip-placement-bottomRight': {
      '.ant-tooltip-arrow': {
        top: 1
      }
    },

    '.ant-select-modal-input-content': {
      '.ant-select-modal-input-placeholder': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        display: 'block',
        'white-space': 'nowrap'
      }
    },

    '.ant-sw-header-left-part + .ant-sw-header-center-part .ant-sw-sub-header-title': {
      display: 'block',
      textAlign: 'center'
    },

    '.ant-sw-qr-scanner-camera-items-container.ant-select-modal': {
      maxWidth: 404,
      width: '100% !important',

      '@media (min-width: 992px)': {
        left: 'auto',
        right: token.paddingLG,
        bottom: token.paddingLG,
        top: token.paddingLG,

        '.ant-sw-modal-content': {
          height: '100%',
          maxHeight: '100%',
          width: '100%',
          paddingLeft: token.paddingLG,
          paddingRight: token.paddingLG
        },

        '.ant-sw-list-section .ant-sw-list-wrapper': {
          flexBasis: 'auto'
        }
      }
    },
    '.ant-btn-ghost.-ghost-type-3': {
      color: token.colorWhite,
      '&:hover': {
        color: token.colorSuccess
      },
      '&:active': {
        color: token['cyan-2']
      },
      '&:disabled': {
        color: token.colorTextLight6
      }
    }
  });
});

function ThemeGenerator ({ children, themeConfig }: Props): React.ReactElement<Props> {
  const { token } = useToken();

  // Generate theme from config
  const theme = useMemo<Theme>(() => {
    return generateTheme(themeConfig, token);
  }, [themeConfig, token]);

  return (
    <StyledComponentThemeProvider theme={theme}>
      <GlobalStyle theme={theme} />
      {children}
    </StyledComponentThemeProvider>
  );
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}

const getModalContainer = () => document.getElementById('popup-container') || document.body;
const getPopupContainer = () => document.getElementById('tooltip-container') || document.body;

const TooltipContainer = styled.div({
  '& > div': {
    zIndex: 10000
  }
});

export function ThemeProvider ({ children }: ThemeProviderProps): React.ReactElement<ThemeProviderProps> {
  const dataContext = useContext(DataContext);
  const themeName = useSelector((state: RootState) => state.settings.theme);
  const logoMaps = useSelector((state: RootState) => state.settings.logoMaps);
  const [themeReady, setThemeReady] = useState(false);

  const themeConfig = useMemo(() => {
    const config = SW_THEME_CONFIGS[themeName];

    Object.assign(config.logoMap.network, logoMaps.chainLogoMap);
    Object.assign(config.logoMap.symbol, logoMaps.assetLogoMap);

    return config;
  }, [logoMaps, themeName]);

  useEffect(() => {
    dataContext.awaitStores(['settings']).then(() => {
      setThemeReady(true);
    }).catch(console.error);
  }, [dataContext]);

  // Reduce number of re-rendering
  if (!themeReady) {
    return <></>;
  }

  return (
    <ConfigProvider
      getModalContainer={getModalContainer}
      getPopupContainer={getPopupContainer}
      theme={themeConfig}
    >
      <ThemeGenerator themeConfig={themeConfig}>
        <TooltipContainer id='tooltip-container' />
        {children}
      </ThemeGenerator>
    </ConfigProvider>
  );
}
