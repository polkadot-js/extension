// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Number } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import EarningTypeTag from '../../../../../components/Earning/EarningTypeTag';

export type Props = ThemeProps

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={CN(className, 'flex-row')}>
      <div className={CN('__block-item', '__total-balance-block')}>
        <div className={'__block-title-wrapper'}>
          <div className={'__earning-block-item'}>
            <div className={'__block-title'}>{('Active stake')}</div>
            <div className={'__tag-earning-type'}>
              <EarningTypeTag
                chain={'polkadot'}
                className={'__item-tag'}
                comingSoon={true}
              />
            </div>
          </div>
          <div className={'earning-token-active-stake'}>
            <Number
              className={'__active-stake-value'}
              decimal={2}
              size={38}
              suffix={'DOT'}
              value={'34560092'}
            />
          </div>
          <div className={'earning-balance-active-stake'}>
            <Number
              decimal={0}
              prefix={'$'}
              size={30}
              value={'34560092'}
            />
          </div>
        </div>
      </div>
      <div
        className='__block-divider'
      />

      <div className={CN('__block-item', '__estimate-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Estimate earning')}</div>
        </div>

        <div className={'__block-content'}>
          <Number
            className='__balance-value'
            decimal={2}
            size={30}
            suffix='%'
            value={'1609'}
          />
        </div>
        <div className={'earning-item-reward-sub-text'}>{t('per year')}</div>
      </div>

      <div
        className='__block-divider'
      />

      <div className={CN('__block-item', '__balance-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Minimum staked')}</div>
        </div>

        <div className={'__block-content'}>
          <Number
            className='__active-stake-value'
            decimal={2}
            decimalOpacity={0.45}
            size={30}
            suffix={'DOT'}
            value={125}
          />
        </div>
      </div>

      <div
        className='__block-divider __divider-special'
      />

      <div className={CN('__block-item', '__action-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Unstaking period')}</div>
        </div>

        <div className={'__block-content'}>
          <Number
            className='__active-stake-value'
            decimal={0}
            size={30}
            suffix={'days'}
            value={28}
          />
        </div>
      </div>
    </div>
  );
}

const HeaderDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  marginBottom: 56,
  flexWrap: 'wrap',

  '.ant-number .ant-typography': {
    fontSize: 'inherit !important',
    fontWeight: 'inherit !important',
    lineHeight: 'inherit'
  },

  '.__block-title': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight
  },
  '.__earning-block-item > .__block-title': {
    paddingRight: 8
  },
  '.__block-item.__balance-block .__block-content': {
    marginTop: -18
  },

  '.__balance-value': {
    fontWeight: token.headingFontWeight,
    '.ant-number-decimal': {
      fontSize: '24px !important',
      lineHeight: '32px !important'
    }
  },

  '.__block-divider': {
    height: 116,
    width: 1,
    backgroundColor: token.colorBgDivider,
    marginTop: token.marginSM
  },

  '.__divider-special': {
    display: 'block'
  },

  '.__balance-change-container': {
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'center',
    marginTop: token.marginSM
  },

  '.__active-stake-value': {
    fontSize: token.fontSizeHeading2,
    lineHeight: token.lineHeightHeading2,
    fontWeight: token.headingFontWeight,
    color: token.colorTextLight1,

    '.ant-number-integer': {
      color: 'inherit !important',
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.ant-number-decimal, .ant-number-suffix': {
      color: `${token.colorTextLight3} !important`,
      fontSize: `${token.fontSizeHeading3}px !important`,
      fontWeight: 'inherit !important',
      lineHeight: token.lineHeightHeading3
    }
  },

  '.__earning-block-item': {
    display: 'flex'
  },
  '.earning-balance-active-stake': {
    color: token.colorTextTertiary
  },
  '.__balance-change-value': {
    marginRight: token.sizeXS,
    lineHeight: token.lineHeight
  },
  '.earning-item-reward-sub-text': {
    fontSize: token.fontSizeLG,
    lineHeight: token.lineHeightLG,
    color: token.colorTextLight4,
    // backgroundColor: 'green',
    paddingBottom: 6
  },

  '.__balance-change-percent': {
    backgroundColor: token['cyan-6'],
    color: token['green-1'],
    marginInlineEnd: 0,
    display: 'flex',

    '&.-decrease': {
      backgroundColor: token.colorError,
      color: token.colorTextLight1
    },

    '.ant-number': {
      fontSize: token.fontSizeXS
    }
  },

  '.__block-item': {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 200px'
  },

  '.__block-title-wrapper': {
    display: 'flex',
    gap: token.sizeXS,
    minHeight: 40,
    marginBottom: token.marginXS,
    alignItems: 'center',
    flexDirection: 'column'
  },

  '.__total-balance-block': {
    '.__balance-value': {
      fontSize: 38,
      lineHeight: '46px'
    }
  },

  '.__balance-block': {
    alignItems: 'center',

    '.__balance-value': {
      fontSize: 30,
      lineHeight: '38px'
    }
  },

  '.__balance-reload-toggle': {
    marginLeft: -token.sizeXS / 2
  },

  '.__action-block': {
    alignItems: 'center',

    '.__block-content': {
      display: 'flex',
      gap: token.sizeSM
    }
  },

  '.__action-button': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: token.sizeSM,

    '.ant-squircle': {
      marginLeft: 6,
      marginRight: 6
    }
  },

  '@media screen and (min-width: 990px) and (max-width: 1200px)': {
    '.__divider-special': {
      display: 'none'
    }
  },

  '@media screen and (min-width: 1480px) and (max-width: 1600px)': {
    '.__balance-value': {
      fontSize: '28px !important',
      '.ant-number-decimal': {
        fontSize: '22px !important'
      }
    },
    '.__total-balance-block': {
      '.__balance-value': {
        fontSize: '35px !important'
      }
    }
  },

  '@media screen and (max-width: 1480px)': {
    '.__balance-value': {
      fontSize: '25px !important',
      '.ant-number-decimal': {
        fontSize: '20px !important'
      }
    }
  },

  '@media screen and (max-width: 1200px)': {
    '.__action-block': {
      flexBasis: '100% !important'
    }
  }

}));

export default HeaderDesktopPart;
