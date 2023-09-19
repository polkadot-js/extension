// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import SelectAccountType from '@subwallet/extension-koni-ui/components/Account/SelectAccountType';
import BackIcon from '@subwallet/extension-koni-ui/components/Icon/BackIcon';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { SELECTED_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants';
import { DEFAULT_ACCOUNT_TYPES } from '@subwallet/extension-koni-ui/constants/account';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useClickOutSide from '@subwallet/extension-koni-ui/hooks/dom/useClickOutSide';
import useSwitchModal from '@subwallet/extension-koni-ui/hooks/modal/useSwitchModal';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { renderModalSelector } from '@subwallet/extension-koni-ui/utils/common/dom';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { KeypairType } from '@polkadot/util-crypto/types';

interface Props extends ThemeProps {
  id: string;
  previousId: string;
  nextId?: string;
  url: string;
  label: string;
  icon?: PhosphorIcon;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, icon = CheckCircle, id, label, nextId, previousId, url } = props;
  const { t } = useTranslation();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const isActive = checkActive(id);
  const navigate = useNavigate();
  const { isWebUI } = useContext(ScreenContext);
  const [selectedItems, setSelectedItems] = useState<KeypairType[]>(DEFAULT_ACCOUNT_TYPES);
  const [, setSelectedAccountTypes] = useLocalStorage(SELECTED_ACCOUNT_TYPE, DEFAULT_ACCOUNT_TYPES);

  const onCancel = useCallback(() => {
    inactiveModal(id);
  }, [id, inactiveModal]);

  const onSubmit = useCallback(() => {
    setSelectedAccountTypes(selectedItems);

    if (isWebUI && nextId) {
      activeModal(nextId);
    } else {
      navigate(url);
    }

    inactiveModal(id);
  }, [selectedItems, isWebUI, inactiveModal, id, activeModal, navigate, url, nextId, setSelectedAccountTypes]);

  const onBack = useSwitchModal(id, previousId);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  useEffect(() => {
    if (!isActive) {
      setSelectedItems(DEFAULT_ACCOUNT_TYPES);
    }
  }, [isActive]);

  return (
    <BaseModal
      className={CN(className)}
      closeIcon={(<BackIcon />)}
      id={id}
      maskClosable={false}
      onCancel={onBack}
      rightIconProps={{
        icon: <CloseIcon />,
        onClick: onCancel
      }}
      title={t<string>('Select account type')}
    >
      <div className='__select-account-type'>
        <SelectAccountType
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
        />
      </div>
      <Button
        block={true}
        disabled={!selectedItems.length}
        icon={(
          <Icon
            className={'icon-submit'}
            phosphorIcon={icon}
            weight='fill'
          />
        )}
        onClick={onSubmit}
      >
        {label}
      </Button>
    </BaseModal>
  );
};

const AccountTypeModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__select-account-type': {
      marginBottom: token.size
    }
  };
});

export default AccountTypeModal;
