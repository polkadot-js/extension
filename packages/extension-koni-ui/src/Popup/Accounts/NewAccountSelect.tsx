// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Header } from '@subwallet/extension-koni-ui/partials';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const NewAccountSelect = ({ className }: Props) => {
  const { t } = useTranslation();

  return (
    <div className={CN(className)}>
      <Header
        showBackArrow={true}
        showSubHeader={true}
        subHeaderName={t<string>('New account')}
      />
    </div>
  );
};

export default React.memo(styled(NewAccountSelect)(({ theme }: Props) => `
`));
