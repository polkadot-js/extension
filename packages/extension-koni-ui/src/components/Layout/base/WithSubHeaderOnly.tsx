// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import React, { useContext } from 'react';

import { LayoutBaseProps } from './Base';

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

  const { isWebUI } = useContext(ScreenContext);
  const { isSettingPage } = useContext(WebUIContext);

  return (
    <Layout.Base
      className={'layout-with-sub-header-only'}
      showBackButton={showBackButton}
      showSubHeader={!isWebUI || isSettingPage}
      subHeaderBackground='transparent'
      subHeaderCenter={subHeaderCenter}
      subHeaderPaddingVertical={subHeaderPaddingVertical}
      {...restProps}
      showHeader={false}
    >
      {children}
    </Layout.Base>
  );
};

export { WithSubHeaderOnly };
