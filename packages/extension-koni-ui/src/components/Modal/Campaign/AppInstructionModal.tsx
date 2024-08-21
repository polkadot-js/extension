// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InstructionItem } from '@subwallet/extension-koni-ui/components';
import { APP_INSTRUCTION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AppContentButtonInstruction, AppInstructionInfo } from '@subwallet/extension-koni-ui/types/staticContent';
import { convertHexColorToRGBA, getBannerButtonIcon } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, Button, Image, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const modalId = APP_INSTRUCTION_MODAL;

interface Props extends ThemeProps {
  title: string;
  media?: string;
  data: AppInstructionInfo[];
  instruction: AppContentButtonInstruction;
  onPressCancelBtn: () => void;
  onPressConfirmBtn: () => void;
}

const Component = ({ className, data, instruction, media, onPressCancelBtn, onPressConfirmBtn, title }: Props) => {
  const footer = useMemo(
    () => (
      <div className={'footer-wrapper'}>
        <Button
          block
          onClick={onPressCancelBtn}
          schema={'secondary'}
        >
          {instruction.cancel_label}
        </Button>
        <Button
          block
          onClick={onPressConfirmBtn}
        >
          {instruction.confirm_label}
        </Button>
      </div>
    ),
    [instruction.cancel_label, instruction.confirm_label, onPressCancelBtn, onPressConfirmBtn]
  );

  return (
    <SwModal
      className={CN(className)}
      footer={footer}
      id={modalId}
      onCancel={onPressCancelBtn}
      title={title}
    >
      <>
        {media && (
          <Image
            alt={''}
            className={'instruction-image'}
            src={media}
            width={'100%'}
          />
        )}

        <div className={'content-wrapper'}>
          {data.map((_props, index) => (
            <InstructionItem
              description={_props.description}
              iconInstruction={_props.icon
                ? <BackgroundIcon
                  backgroundColor={_props.icon_color && convertHexColorToRGBA(_props.icon_color, 0.1)}
                  iconColor={_props.icon_color}
                  phosphorIcon={getBannerButtonIcon(_props.icon as unknown as string)}
                  size={'lg'}
                  weight={'fill'}
                />
                : undefined}
              key={index}
              title={_props.title}
            />
          ))}
        </div>
      </>
    </SwModal>
  );
};

const AppInstructionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',

    '.instruction-image': {
      marginBottom: token.marginXS
    },

    '.content-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },
    '.footer-wrapper': {
      display: 'flex',
      gap: token.sizeSM
    }
  };
});

export default AppInstructionModal;
