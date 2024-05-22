// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InstructionItem } from '@subwallet/extension-koni-ui/components';
import { BoxProps } from '@subwallet/extension-koni-ui/components/Modal/Earning/EarningInstructionModal';
import { APP_INSTRUCTION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AppContentButtonInstruction } from '@subwallet/extension-koni-ui/types/staticContent';
import { Button, Icon, Image, SwModal, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const modalId = APP_INSTRUCTION_MODAL;

interface Props extends ThemeProps {
  title: string;
  media?: string;
  data: BoxProps[];
  instruction: AppContentButtonInstruction;
  onPressCancelBtn: () => void;
  onPressConfirmBtn: () => void;
}

const Component = ({ className, data, instruction, media, onPressCancelBtn, onPressConfirmBtn, title }: Props) => {
  const footer = useMemo(
    () => (
      <div style={{ flexDirection: 'row', gap: 12 }}>
        <Button
          block
          onClick={onPressCancelBtn}
        >
          {instruction.cancel_label}
        </Button>
        <Button
          block
          onClick={onPressConfirmBtn}
          type={'primary'}
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
    >
      <>
        <Typography.Text>{title}</Typography.Text>
        {media && (
          <Image
            alt={''}
            src={media}
            width={'100%'}
          />
        )}

        {data.map((_props, index) => (
          <InstructionItem
            description={_props.description}
            iconInstruction={<Icon phosphorIcon={_props.icon} />}
            key={index}
            title={_props.title}
          />
        ))}
      </>
    </SwModal>
  );
};

const AppInstructionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex'
  };
});

export default AppInstructionModal;
