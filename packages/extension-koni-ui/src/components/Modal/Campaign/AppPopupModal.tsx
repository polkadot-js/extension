// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/types';
import AppInstructionModal from '@subwallet/extension-koni-ui/components/Modal/Campaign/AppInstructionModal';
import ContentGenerator from '@subwallet/extension-koni-ui/components/StaticContent/ContentGenerator';
import { APP_INSTRUCTION_DATA, APP_INSTRUCTION_MODAL, APP_POPUP_MODAL } from '@subwallet/extension-koni-ui/constants';
import { toggleCampaignPopup } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AppContentButton, AppInstructionInfo } from '@subwallet/extension-koni-ui/types/staticContent';
import { ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import OnlineButtonGroups from '../../StaticContent/OnlineButtonGroups';

interface Props extends ThemeProps {
  message: string;
  title: string;
  buttons: AppContentButton[];
  externalButtons?: React.ReactNode;
  onPressButton?: (url?: string) => void;
  onCloseModal?: () => void;
}

export interface StaticDataProps {
  group: string;
  id: string;
  instructions: AppInstructionInfo[];
  locale?: string;
  slug: YieldPoolType | 'DAPP_STAKING' | 'UNSTAKE_INFO';
  title: string | null;
  media: string | null;
}

const modalId = APP_POPUP_MODAL;
const instructionModalId = APP_INSTRUCTION_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { buttons, className, externalButtons, message, onCloseModal, onPressButton, title } = props;
  const [appInstructionData] = useLocalStorage(APP_INSTRUCTION_DATA, '[]');
  const instructionDataList: StaticDataProps[] = useMemo(() => {
    try {
      return JSON.parse(appInstructionData || '[]') as StaticDataProps[];
    } catch (e) {
      console.error(e);

      return [];
    }
  }, [appInstructionData]);

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const instructionButton = useMemo(() => {
    const buttonHasInstruction = (buttons && buttons.length) ? buttons.find((btn) => !!btn.instruction) : undefined;

    if (buttonHasInstruction) {
      return buttonHasInstruction;
    } else {
      return undefined;
    }
  }, [buttons]);

  const currentInstructionData = useMemo(() => {
    if (instructionButton && instructionButton.instruction) {
      return instructionDataList.find(
        (item) =>
          item.group === instructionButton.instruction?.group && item.slug === instructionButton.instruction?.slug
      );
    } else {
      return undefined;
    }
  }, [instructionButton, instructionDataList]);

  const onAccept = useCallback(
    (url?: string) => {
      inactiveModal(instructionModalId);
      onPressButton && onPressButton(url);
      onCloseModal && onCloseModal();
    },
    [onCloseModal, onPressButton, inactiveModal]
  );

  const _onClickButton = useCallback(
    (url?: string, hasInstruction?: boolean) => {
      toggleCampaignPopup({ value: false }).then(() => {
        if (instructionButton && instructionButton.instruction && currentInstructionData && hasInstruction) {
          activeModal(instructionModalId);
        } else {
          onAccept(url);
        }
      }).catch((e) => console.log(e));
    },
    [currentInstructionData, instructionButton, onAccept, activeModal]
  );

  const onClickCancelBtn = useCallback(() => onAccept(), [onAccept]);

  const onClickConfirmBtn = useCallback(() => instructionButton && onAccept(instructionButton.action?.url), [instructionButton, onAccept]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={false}
        footer={
          externalButtons || <OnlineButtonGroups
            buttons={buttons}
            onClickButton={_onClickButton}
          />
        }
        id={modalId}
        maskClosable={false}
        title={title}
      >
        <ContentGenerator content={message} />
      </SwModal>

      {!!instructionButton && instructionButton.instruction && currentInstructionData && (
        <AppInstructionModal
          data={currentInstructionData.instructions}
          instruction={instructionButton.instruction}
          media={currentInstructionData.media || ''}
          onPressCancelBtn={onClickCancelBtn}
          onPressConfirmBtn={onClickConfirmBtn}
          title={currentInstructionData.title || 'Instruction'}
        />
      )}
    </>
  );
};

const AppPopupModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-body': {
      paddingBottom: 0
    },
    '.ant-sw-modal-footer': {
      borderTop: 'none'
    }
  };
});

export default AppPopupModal;
