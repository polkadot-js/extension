// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Debugger } from '@subwallet/extension-koni-ui/Popup/Debugger';
import { Button } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import SwModal from '@subwallet/react-ui/es/sw-modal';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { Bug } from 'phosphor-react';
import React, { useCallback, useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
}

export const PREDEFINED_MODAL_NAMES = ['debugger', 'transaction', 'confirmation'];
type PredefinedModalName = typeof PREDEFINED_MODAL_NAMES[number];

export const usePredefinedModal = () => {
  const [, setSearchParams] = useSearchParams();

  return {
    openModal: (name: PredefinedModalName) => {
      setSearchParams((prev) => {
        prev.set('popup', name);

        return prev;
      });
    }
  };
};

const DebugIcon = <Icon
  phosphorIcon={Bug}
  type={'phosphor'}
/>;

const DebugTrigger = styled.div(({ theme }) => ({
  position: 'fixed',
  right: 16,
  bottom: 90
}));

export const WalletModalContext = ({ children }: Props) => {
  const modalContext = useContext(ModalContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const openModal = usePredefinedModal().openModal;

  useEffect(() => {
    const confirmID = searchParams.get('popup');

    // Auto open confirm modal with method modalContext.activeModal else auto close all modal
    if (confirmID) {
      PREDEFINED_MODAL_NAMES.includes(confirmID) && modalContext.activeModal(confirmID);
    } else {
      modalContext.inactiveModals(PREDEFINED_MODAL_NAMES);
    }
  }, [searchParams]);

  const onCloseModal = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete('popup');

      return prev;
    });
  }, [setSearchParams]);

  const openDebugger = useCallback(() => {
    openModal('debugger');
  }, [setSearchParams]);

  return <>
    {children}
    <DebugTrigger>
      <Button
        block
        icon={DebugIcon}
        onClick={openDebugger}
        shape='round'
      />
    </DebugTrigger>
    <SwModal
      id={'debugger'}
      onCancel={onCloseModal}
      title={'Debugger'}
    >
      <Debugger />
    </SwModal>
  </>;
};
