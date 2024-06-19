// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import AppInstructionModal from '@subwallet/extension-koni-ui/components/Modal/Campaign/AppInstructionModal';
import { StaticDataProps } from '@subwallet/extension-koni-ui/components/Modal/Campaign/AppPopupModal';
import { APP_INSTRUCTION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AppBannerData } from '@subwallet/extension-koni-ui/types/staticContent';
import { Button, Icon, Image, ModalContext } from '@subwallet/react-ui';
import { X } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  data: AppBannerData;
  dismissBanner?: (ids: string[]) => void;
  onClickBanner: (id: string) => (url?: string) => void;
  instructionDataList: StaticDataProps[];
}

const Component = ({ className, data, dismissBanner, instructionDataList, onClickBanner }: Props) => {
  const bannerId = useMemo(() => `${data.position}-${data.id}`, [data.id, data.position]);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const currentInstructionData = useMemo(() => {
    if (data.instruction) {
      return instructionDataList.find(
        (item) => item.group === data.instruction?.group && item.slug === data.instruction?.slug
      );
    } else {
      return undefined;
    }
  }, [data.instruction, instructionDataList]);

  const _onClickBanner = useCallback(() => {
    const url = data.action?.url;
    const instruction = data.instruction;

    if (instruction) {
      activeModal(APP_INSTRUCTION_MODAL);

      return;
    }

    if (url) {
      onClickBanner(bannerId)(url);
    }
  }, [activeModal, bannerId, data.action?.url, data.instruction, onClickBanner]);

  const _dismissBanner = useCallback(() => dismissBanner && dismissBanner([bannerId]), [bannerId, dismissBanner]);

  const onClickCancelInstructionModal = useCallback(() => inactiveModal(APP_INSTRUCTION_MODAL), [inactiveModal]);

  const onClickConfirmInstructionModal = useCallback(() => {
    inactiveModal(APP_INSTRUCTION_MODAL);
    onClickBanner(bannerId)(data.action?.url);
  }, [bannerId, data.action?.url, inactiveModal, onClickBanner]);

  return (
    <>
      <div className={className}>
        <Image
          className='banner-image'
          onClick={_onClickBanner}
          src={data.media}
          width='100%'
        />
        {!!dismissBanner && (
          <Button
            className={'dismiss-button'}
            icon={<Icon
              phosphorIcon={X}
              size={'sm'}
              weight={'bold'}
            />}
            onClick={_dismissBanner}
            shape={'round'}
            size={'xs'}
            type={'ghost'}
          />
        )}
      </div>

      {data.instruction && currentInstructionData && (
        <AppInstructionModal
          data={currentInstructionData.instructions}
          instruction={data.instruction}
          media={currentInstructionData.media || ''}
          onPressCancelBtn={onClickCancelInstructionModal}
          onPressConfirmBtn={onClickConfirmInstructionModal}
          title={currentInstructionData.title || 'Instruction'}
        />
      )}
    </>
  );
};

const Banner = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: 'relative',

    '.dismiss-button': {
      position: 'absolute',
      right: -3,
      top: token.sizeXXS
    }
  };
});

export default Banner;
