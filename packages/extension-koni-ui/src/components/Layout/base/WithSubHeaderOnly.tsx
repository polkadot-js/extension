// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { LayoutBaseProps } from '@subwallet/extension-koni-ui/components/Layout/base/Base';
import React from 'react';

type Props = Omit<
LayoutBaseProps,
'headerBackground' | 'headerIcons' | 'headerLeft' | 'headerCenter' | 'headerOnClickLeft' | 'headerPaddingVertical'
> & Required<Pick<LayoutBaseProps, 'title'>>
  ;

const WithSubHeaderOnly = (props: Props) => {
  const { children,
    showBackButton = true,
    subHeaderCenter = true,
    subHeaderPaddingVertical = true,
    ...restProps } = props;

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
      {children}
    </Layout.Base>
  );
};

export { WithSubHeaderOnly };