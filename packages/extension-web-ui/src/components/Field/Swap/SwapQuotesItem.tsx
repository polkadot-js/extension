// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, CircleWavyCheck } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  recommendIcon?: boolean,
  estReceiveValue: string,
  symbol: string,
  selected?: boolean
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, estReceiveValue, recommendIcon, selected, symbol } = props;

  return (
    <>
      <div className={CN(className, 'swap-quotes-container')}>
        <div className={'__left-part'}>
          <div className={'__line-1'}>
            <span className={'__provider-name'}>Provider name</span>
            {recommendIcon && (
              <Icon
                className='wavy-icon'
                phosphorIcon={CircleWavyCheck}
                customSize={'16px'}
                size='md'
                weight='fill'
              />
            )}
          </div>
          <div className={'__line-2'}>
            <span className={'__item-label'}>Est.receive</span>
            <span className={'__item-value'}>{estReceiveValue}&nbsp;{symbol}</span>
          </div>
        </div>
        {selected && (<div className={'__right-part'}>
          <Icon
            className='check-icon'
            phosphorIcon={CheckCircle}
            size='md'
            weight='fill'
          />
        </div>)}
      </div>
    </>
  );
};

const ChooseFeeItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: token.colorBgSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    '.__line-2': {
      display: 'flex',
      gap: 4
    },
    '.wavy-icon': {
      color: token.colorPrimary,
      paddingLeft: 4
    },
    '.__provider-name': {
      fontSize: 14,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeight,
      color: token.colorTextTertiary
    },
    '.__item-label': {
      color: token.colorTextTertiary
    },
    '.__item-value': {
      color: token.colorWhite
    },
    '.check-icon': {
      color: token.colorSuccess
    }
  };
});

export default ChooseFeeItem;
