// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import SelectAccountType from '@subwallet/extension-koni-ui/components/Account/SelectAccountType';
import BackIcon from '@subwallet/extension-koni-ui/components/Icon/BackIcon';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import { DEFAULT_ACCOUNT_TYPES } from '@subwallet/extension-koni-ui/constants/account';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useClickOutSide from '@subwallet/extension-koni-ui/hooks/dom/useClickOutSide';
import useSwitchModal from '@subwallet/extension-koni-ui/hooks/modal/useSwitchModal';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { setSelectedAccountTypes } from '@subwallet/extension-koni-ui/utils';
import { renderModalSelector } from '@subwallet/extension-koni-ui/utils/common/dom';
import { Button, Icon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

interface Props extends ThemeProps {
  id: string;
  previousId: string;
  url: string;
  label: string;
  icon?: PhosphorIcon;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, id, previousId, url, label, icon = CheckCircle } = props;
  const { t } = useTranslation();
  const { checkActive, inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const isActive = checkActive(id);

  const [selectedItems, setSelectedItems] = useState<KeypairType[]>(DEFAULT_ACCOUNT_TYPES);

  const onCancel = useCallback(() => {
    inactiveModal(id);
  }, [id, inactiveModal]);

  const onSubmit = useCallback(() => {
    setSelectedAccountTypes(selectedItems);
    navigate(url);
    inactiveModal(id);
  }, [selectedItems, navigate, url, inactiveModal, id]);

  const onBack = useSwitchModal(id, previousId);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  useEffect(() => {
    if (!isActive) {
      setSelectedItems(DEFAULT_ACCOUNT_TYPES);
    }
  }, [isActive]);

  return (
    <SwModal
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
      <div className='items-container'>
        <SelectAccountType
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
        />
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
      </div>
    </SwModal>
  );
};

const AccountTypeModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default AccountTypeModal;
