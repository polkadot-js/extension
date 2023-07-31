import React from 'react';
import styled from 'styled-components';

import { AnimatedMessage, InputFileWithLabel } from '../../components';
import useTranslation from '../../hooks/useTranslation';

const acceptedFormats = ['application/json', 'text/plain'].join(', ');

interface Props {
  className?: string;
  onChangeFile: (file: Uint8Array) => void;
  isFileError: boolean;
  setFileName: (fileName: string) => void;
}

function ImportJsonDropzoneStep({ className, isFileError, onChangeFile, setFileName }: Props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <div className={className}>
        <InputFileWithLabel
          accept={acceptedFormats}
          isError={isFileError}
          onChange={onChangeFile}
          setFileName={setFileName}
        />
        <StyledAnimatedMessage
          in={isFileError}
          messageType='critical'
          text={t<string>('Invalid Json file')}
        />
      </div>
    </>
  );
}

const StyledAnimatedMessage = styled(AnimatedMessage)`
  margin-top: 8px;
  margin-inline: 16px;
`;

export default styled(ImportJsonDropzoneStep)`
  + .splash {
    border: 1px solid red;
    display: none;
    opacity: 0;
  }

  .restoreButton {
    margin-top: 16px;
  }
`;
