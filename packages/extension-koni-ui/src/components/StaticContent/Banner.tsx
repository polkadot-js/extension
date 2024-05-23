import React, {useCallback, useContext, useMemo} from "react";
import {Button, Icon, Image, ModalContext} from "@subwallet/react-ui";
import { APP_INSTRUCTION_MODAL } from "@subwallet/extension-koni-ui/constants";
import {X} from "phosphor-react";
import AppInstructionModal from "@subwallet/extension-koni-ui/components/Modal/Campaign/AppInstructionModal";
import styled from "styled-components";
import {ThemeProps} from "@subwallet/extension-koni-ui/types";
import {AppBannerData} from "@subwallet/extension-koni-ui/types/staticContent";
import {StaticDataProps} from "@subwallet/extension-koni-ui/components/Modal/Campaign/AppPopupModal";

interface Props extends ThemeProps {
  data: AppBannerData;
  dismissBanner?: (ids: string[]) => void;
  onPressBanner: (id: string) => (url?: string) => void;
  instructionDataList: StaticDataProps[];
}

const Component = ({ data, dismissBanner, onPressBanner, instructionDataList, className }: Props) => {
  const bannerId = useMemo(() => `${data.position}-${data.id}`, [data.id, data.position]);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const currentInstructionData = useMemo(() => {
    if (data.instruction) {
      return instructionDataList.find(
        item => item.group === data.instruction?.group && item.slug === data.instruction?.slug,
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
      onPressBanner(bannerId)(url);
    }
  }, [bannerId, data.action?.url, data.instruction, onPressBanner]);
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
            icon={<Icon phosphorIcon={X} weight={'bold'} size={'sm'} />}
            onClick={() => dismissBanner([bannerId])}
            shape={'round'}
            className={'dismiss-button'}
            size={'xs'}
            type={'ghost'}
          />
        )}
      </div>

      {data.instruction && currentInstructionData && (
        <AppInstructionModal
          title={currentInstructionData.title || 'Instruction'}
          instruction={data.instruction}
          data={currentInstructionData.instructions}
          onPressCancelBtn={() => inactiveModal(APP_INSTRUCTION_MODAL)}
          onPressConfirmBtn={() => {
            inactiveModal(APP_INSTRUCTION_MODAL);
            onPressBanner(bannerId)(data.action.url);
          }}
        />
      )}
    </>
  );
}

const Banner = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: 'relative',

    '.dismiss-button': {
      position: 'absolute',
      right: -3,
      top: 5
    }
  };
});

export default Banner;
