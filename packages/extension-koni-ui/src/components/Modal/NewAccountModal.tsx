// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import SelectAccountType from '@subwallet/extension-koni-ui/components/Account/SelectAccountType';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { NEW_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

type Props = ThemeProps;

const modalId = NEW_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState<KeypairType[]>([SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE]);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onSubmit = useCallback(() => {
    navigate('/accounts/new-seed-phrase', { state: { accountTypes: selectedItems } });
    inactiveModal(modalId);
  }, [navigate, selectedItems, inactiveModal]);

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      onCancel={onCancel}
      title={t<string>('Select account type')}
    >
      <div className='items-container'>
        <SelectAccountType
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
        />
        <Button
          block={true}
          icon={(
            <Icon
              className={'icon-submit'}
              iconColor='var(--icon-color)'
              phosphorIcon={CheckCircle}
              weight='fill'
            />
          )}
          onClick={onSubmit}
        >
          {t('Confirm')}
        </Button>
      </div>
    </SwModal>
  );
};

const CreateAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },

    '.icon-submit': {
      '--icon-color': token.colorTextBase
    }
  };
});

export default CreateAccountModal;
