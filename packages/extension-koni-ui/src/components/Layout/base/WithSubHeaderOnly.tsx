// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import React, { useContext } from 'react';

import { LayoutBaseProps } from './Base';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';

type Props = Omit<
LayoutBaseProps,
'headerBackground' | 'headerIcons' | 'headerLeft' | 'headerCenter' | 'headerOnClickLeft' | 'headerPaddingVertical' | 'showHeader'
> & Required<Pick<LayoutBaseProps, 'title'>>
  ;

const WithSubHeaderOnly = (props: Props) => {
  const { children,
    showBackButton = true,
    subHeaderCenter = true,
    subHeaderPaddingVertical = true,
    ...restProps } = props;

  const { isWebUI } = useContext(ScreenContext)

  return (
    <Layout.Base
      showBackButton={showBackButton}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={subHeaderCenter}
      subHeaderPaddingVertical={subHeaderPaddingVertical}
      {...restProps}
      showHeader={false}
    >
      <div style={{
        ...(isWebUI && {
          maxWidth: '70%',
          margin: '0 auto'
        })
      }}>
        {children}
      </div>
    </Layout.Base>
  );
};

export { WithSubHeaderOnly };
