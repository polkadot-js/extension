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
  children: JSX.Element | JSX.Element[];
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

      <div className='unknown-signing__separator' />
      <Warning
        className='signing-error'
      >
        {t('This type account does not support this feature')}
      </Warning>

      <div className={'unknown-signing-btn-container'}>
        <Button
          className={'unknown-signing-cancel-button'}
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
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  flex-direction: column;
  flex: 1;

  .signing-error {
    margin-top: 10px;
  }

  .unknown-signing__separator {
    margin-top: 30px;
    margin-bottom: 18px;
  }

  .unknown-signing__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .unknown-signing-btn-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .unknown-signing-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }
`));
