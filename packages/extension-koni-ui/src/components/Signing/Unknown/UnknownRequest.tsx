// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  children: JSX.Element;
  hideConfirm: () => Promise<void> | void;
}

const UnknownRequest = ({ children,
  className,
  hideConfirm }: Props) => {
  const { t } = useTranslation();
  const { signingState } = useContext(SigningContext);

  const { isBusy } = signingState;

  return (
    <div className={CN(className)}>
      { children }

      <div className='bonding-auth__separator' />
      <Warning
        className='auth-transaction-error'
      >
        {t('This type account does not support this feature')}
      </Warning>

      <div className={'bonding-auth-btn-container'}>
        <Button
          className={'bonding-auth-cancel-button'}
          onClick={hideConfirm}
        >
          {t('Reject')}
        </Button>
        <Button
          isBusy={isBusy}
          isDisabled={true}
        >
          {t('Confirm')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(UnknownRequest)(({ theme }: Props) => `
`));
