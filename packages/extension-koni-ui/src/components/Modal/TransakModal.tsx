// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Modal } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import qs from 'querystring';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  closeModal: () => void;
}

const HOST = {
  STAGING: 'https://staging-global.transak.com',
  PRODUCTION: 'https://global.transak.com'
};

const TransakModal = (props: Props) => {
  const { className, closeModal } = props;

  const { t } = useTranslation();

  const url = useMemo((): string => {
    const host = HOST.PRODUCTION;

    const params = {
      // apiKey: '4fcd6904-706b-4aff-bd9d-77422813bbb7'
    };
    const query = qs.stringify(params);

    return `${host}?${query}`;
  }, []);

  return (
    <Modal className={CN(className)}>
      <div className='transak-header'>
        <div className='transak-header__part-1' />
        <div className='transak-header__part-2'>
          {t<string>('Buy token')}
        </div>
        <div className='transak-header__part-3'>
          <span
            className={'transak-header__close-btn'}
            onClick={closeModal}
          >
            {t('Cancel')}
          </span>
        </div>
      </div>
      <div className='transak-body'>
        <iframe
          height={488}
          src={url}
          width={420}
        />
      </div>
    </Modal>
  );
};

export default React.memo(styled(TransakModal)(({ theme }: Props) => `
  .subwallet-modal {
    max-width: 460px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 0;
    padding: 0;
  }

  .transak-body {
    padding: 20px;
  }

  .transak-header {
    display: flex;
    align-items: center;
    height: 72px;
    box-shadow: ${theme.headerBoxShadow};
  }

    .transak-header__part-1 {
    flex: 1;
  }

  .transak-header__part-2 {
    color: ${theme.textColor};
    font-size: 20px;
    font-weight: 500;
  }

  .transak-header__part-3 {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .transak-header__close-btn {
    padding-left: 16px;
    padding-right: 16px;
    height: 40px;
    display: flex;
    align-items: center;
    color: ${theme.buttonTextColor2};
    cursor: pointer;
  }

`));
