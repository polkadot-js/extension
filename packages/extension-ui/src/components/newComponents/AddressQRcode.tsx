// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line simple-import-sort/imports

import { CloseRounded, PhotoCameraRounded } from '@mui/icons-material';
import { Avatar, Box, Chip, Container, Divider, Grid, IconButton, Modal } from '@mui/material';
import QRCode from 'qrcode.react';
import React, { Dispatch, SetStateAction, useCallback } from 'react';

import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../hooks/useTranslation';
import getChainLogo from '../../util/newUtils/getChainLogo';

interface Props {
  address: string;
  chain?: Chain | null;
  name: string;
  showQRcodeModalOpen: boolean;
  setQRcodeModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function AddressQRcode ({ address, chain, name, setQRcodeModalOpen, showQRcodeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const handleQRmodalClose = useCallback(
    (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setQRcodeModalOpen(false);
    },
    [setQRcodeModalOpen]
  );

  return (
    <Modal
      // eslint-disable-next-line react/jsx-no-bind
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleQRmodalClose();
        }
      }}
      open={showQRcodeModalOpen}
    >
      <div style={{
        backgroundColor: '#FFFFFF',
        display: 'flex',
        height: '100%',
        maxWidth: 700,
        position: 'relative',
        top: '5px',
        transform: `translateX(${(window.innerWidth - 560) / 2}px)`,
        width: '560px'
      }}
      >
        <Container>
          <Grid container justifyContent='flex-start' xs={12} sx={{ paddingTop: '10px' }}>
            <IconButton edge='start' size='small' onClick={handleQRmodalClose}>
              <CloseRounded fontSize='small' />
            </IconButton>
          </Grid>
          <Grid xs={12}>
            <Box fontSize={12} fontWeight='fontWeightBold'>
              <Divider>
                <Chip icon={<PhotoCameraRounded />} label={t('Scan with Camera')} variant='outlined' />
              </Divider>
            </Box>
          </Grid>
          <Grid alignItems='center' container justifyContent='center' sx={{ padding: '1px 30px 50px' }}>
            <Grid item xs={6} sx={{ padding: '30px 1px 30px' }}>
              <Box fontSize={20} fontWeight='fontWeightBold'>
                {name || t('unknown')}
              </Box>
            </Grid>
            <Grid item xs={3} sx={{ padding: '30px 1px 30px' }}>
            </Grid>
            <Grid item xs={3} sx={{ padding: '30px 1px 30px' }}>
              <Avatar
                alt={'logo'}
                src={getChainLogo(chain)}
              // sx={{ height: 45, width: 45 }}
              />
            </Grid>
            <Grid item xs={12}>
              <QRCode value={address} size={300} level='H' />
            </Grid>
            <Grid item xs={12} sx={{ padding: '25px 1px 10px' }}>
              <Box fontSize={14}>
                {address}
              </Box>
            </Grid>
          </Grid>

        </Container>
      </div>
    </Modal>
  );
}
