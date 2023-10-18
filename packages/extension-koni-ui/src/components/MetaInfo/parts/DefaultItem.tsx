// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface DefaultInfoItem extends InfoItemBase {
  children: React.ReactNode,
  labelAlign?: 'top' | 'center',
  valueAlign?: 'left' | 'right'
}

const Component: React.FC<DefaultInfoItem> = (props: DefaultInfoItem) => {
  const { children, className, label, labelAlign, valueAlign = 'right', valueColorSchema = 'default' } = props;

  return (
    <div className={CN(className, '__row', '-type-default')}>
      {
        !!label && (
          <div className={CN('__col', {
            '-v-align-top': labelAlign === 'top',
            '-v-align-center': labelAlign === 'center'
          }, '__label-col')}
          >
            <div className={'__label'}>
              {label}
            </div>
          </div>
        )
      }

      <div className={CN('__col', {
        '-to-right': valueAlign === 'right'
      }, '__value-col')}
      >
        <div className={`__value -schema-${valueColorSchema}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

const DefaultItem = styled(Component)<DefaultInfoItem>(({ theme: { token } }: DefaultInfoItem) => {
  return {};
});

export default DefaultItem;
