// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MouseEventHandler } from 'react';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { useTranslation } from '../hooks/index.js';
import { styled } from '../styled.js';
import ActionText from './ActionText.js';
import BoxWithLabel from './BoxWithLabel.js';

interface Props {
  seed: string;
  onCopy: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

function MnemonicSeed ({ className, onCopy, seed }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <BoxWithLabel
        className='mnemonicDisplay'
        label={t('Generated 12-word mnemonic seed:')}
        value={seed}
      />
      <div className='buttonsRow'>
        <CopyToClipboard text={seed}>
          <ActionText
            className='copyBtn'
            data-seed-action='copy'
            icon={faCopy}
            onClick={onCopy}
            text={t('Copy to clipboard')}
          />
        </CopyToClipboard>
      </div>
    </div>
  );
}

export default styled(MnemonicSeed)<Props>`
  margin-bottom: 21px;

  .buttonsRow {
    display: flex;
    flex-direction: row;

    .copyBtn {
      margin-right: 32px;
    }
  }

  .mnemonicDisplay {
    .seedBox {
      color: var(--primaryColor);
      font-size: var(--fontSize);
      height: unset;
      letter-spacing: -0.01em;
      line-height: var(--lineHeight);
      margin-bottom: 10px;
      padding: 14px;
    }
  }
`;
