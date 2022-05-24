// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { ActionContext, Button, ButtonArea, HorizontalLabelToggle } from '@subwallet/extension-koni-ui/components';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { disableNetworkMap, enableNetworkMap, removeNetworkMap } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { NetworkConfigParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  item: NetworkJson;
}

function NetworkItem ({ className, item }: Props): React.ReactElement {
  const { show } = useToast();
  const navigate = useContext(ActionContext);
  const [showModal, setShowModal] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const { t } = useTranslation();

  const handleHideModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleShowModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleShowStateConfirm = useCallback((resp: boolean) => {
    if (resp) {
      show(`${item.chain} has ${item.active ? 'disconnected' : 'connected'} successfully`);
    } else {
      show(`${item.chain} has failed to ${item.active ? 'disconnect' : 'connect'}`);
    }
  }, [item, show]);

  const handleShowDeleteConfirm = useCallback((resp: boolean) => {
    if (resp) {
      show('Removed 1 network successfully');
    } else {
      show('Cannot remove an active network');
    }
  }, [item, show]);

  const toggleActive = useCallback((val: boolean) => {
    if (!val) {
      disableNetworkMap(item.key)
        .then(({ success }) => handleShowStateConfirm(success))
        .catch(console.error);
    } else {
      enableNetworkMap(item.key)
        .then((resp) => handleShowStateConfirm(resp))
        .catch(console.error);
    }
  }, [handleShowStateConfirm, item.key]);

  const handleNetworkEdit = useCallback(() => {
    store.dispatch({ type: 'networkConfigParams/update', payload: { data: item, mode: 'edit' } as NetworkConfigParams });
    navigate('/account/config-network');
  }, [item]);

  const handleDeleteNetwork = useCallback(() => {
    removeNetworkMap(item.key)
      .then((result) => handleShowDeleteConfirm(result))
      .catch(console.error);
    handleHideModal();
  }, [item]);

  const handleMouseEnterChain = useCallback(() => {
    setIsHover(true);
  }, []);

  const handleMouseLeaveChain = useCallback(() => {
    setIsHover(false);
  }, []);

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      className={`network-item ${className}`}
    >
      <div className='network-item__top-content'>
        <HorizontalLabelToggle
          checkedLabel={''}
          className='info'
          toggleFunc={toggleActive}
          uncheckedLabel={''}
          value={item.active}
        />
        <div
          className={'link-edit'}
        >
          <div
            className='network-item__text'
            onClick={handleNetworkEdit}
            onMouseEnter={handleMouseEnterChain}
            onMouseLeave={handleMouseLeaveChain}
          >
            {item.chain}
          </div>
          <div className={'network-icon-container'}>
            <FontAwesomeIcon
              className='network-delete-icon'
              // @ts-ignore
              icon={faTrashAlt}
              onClick={handleShowModal}
              size='sm'
            />

            <div
              onClick={handleNetworkEdit}
            >
              <div className={`${isHover ? 'hover-toggle' : 'unhover-toggle'} network-item__toggle`} />
            </div>
          </div>
        </div>
      </div>
      <div className='network-item__separator' />

      {
        showModal &&
        <Modal
          className={'confirm-delete-modal'}
        >
          <div>
            <div className={'delete-modal-title'}>
              <div className={'delete-title'}>Confirm deletion ?</div>
              <div
                className={'close-btn'}
                onClick={handleHideModal}
              >
                x
              </div>
            </div>

            <ButtonArea
              className={'delete-button-area'}
            >
              <Button
                className='network-edit-button'
                onClick={handleHideModal}
              >
                <span>{t<string>('Cancel')}</span>
              </Button>
              <Button
                className='network-edit-button'
                onClick={handleDeleteNetwork}
              >
                {t<string>('Confirm')}
              </Button>
            </ButtonArea>
          </div>
        </Modal>
      }
    </div>
  );
}

export default styled(NetworkItem)(({ theme }: Props) => `
  .close-btn {
    font-size: 20px;
    cursor: pointer;
  }

  .hover-toggle {
    color: ${theme.textColor};
  }

  .unhover-toggle {
    color: ${theme.textColor2};
  }

  .delete-modal-title {
    display: flex;
    justify-content: space-between;
  }

  .delete-button-area {
    margin-top: 20px;
  }

  .network-edit-button:first-child {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};
    font-size: 15px;

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .network-edit-button:nth-child(2) {
    background-color: ${theme.buttonBackgroundDanger};
    font-size: 15px;

    span {
      color: ${theme.buttonTextColor};
    }
  }

  .delete-title {
    font-size: 20px;
    font-weight: 500;
  }

  .confirm-delete-modal .subwallet-modal {
    width: 320px;
    padding: 20px;
    top: 30%;
  }

  .link-edit {
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 100%;
    gap: 10px;
  }

  .network-icon-container {
    width: 20%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .network-item__text {
    width: 80%;
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    color: ${theme.textColor2};
  }

  .network-item__text:hover {
    color: ${theme.textColor};
  }

  .network-delete-icon {
    color: ${theme.textColor2};
  }

  .network-delete-icon:hover {
    color: ${theme.iconDangerColor};
  }

  .network-item__toggle {
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3.5px;
    transform: rotate(-45deg);
  }
`);
