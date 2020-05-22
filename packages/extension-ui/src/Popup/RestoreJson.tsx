// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringPair$Json } from '@polkadot/keyring/types';
import React, { useCallback, useState, createRef } from 'react';
import Dropzone, { DropzoneRef } from 'react-dropzone';
import { InputWithLabel, Button, Address } from '../components';
import { isHex, u8aToString, hexToU8a, formatNumber } from '@polkadot/util';
import styled from 'styled-components';
import { jsonRestore, /* jsonVerifyPassword, jsonVerifyFile */ } from '../messaging';

import { Header } from '../partials';

type Props = {};

export interface InputFileProps {
	// Reference Example Usage: https://github.com/react-dropzone/react-dropzone/tree/master/examples/Accept
	// i.e. MIME types: 'application/json, text/plain', or '.json, .txt'
	accept?: string;
	clearContent?: boolean;
	convertHex?: boolean;
	help?: React.ReactNode;
	isDisabled?: boolean;
	isError?: boolean;
	label: React.ReactNode;
	onChange?: (contents: Uint8Array, name: string) => void;
	placeholder?: React.ReactNode | null;
	withEllipsis?: boolean;
	withLabel?: boolean;
}

interface FileState {
	name: string;
	size: number;
}

interface JsonState {
	address: string | null;
	isJsonValid: boolean;
	json: KeyringPair$Json | null;
}

interface PassState {
	isPassValid: boolean;
	password: string;
}

const acceptedFormats = ['application/json', 'text/plain'].join(', ');

export default function Upload(): React.ReactElement<Props> {
	const [{ address, isJsonValid, json }, setJson] = useState<JsonState>({ address: null, isJsonValid: false, json: null });
	const [{ isPassValid, password }, setPass] = useState<PassState>({ isPassValid: false, password: '' });

	const _onChangePass = useCallback(
		(password: string): void => {
			const isPassValid = true; //jsonVerifyPassword(null, password)
			setPass({ isPassValid, password })
		}, []
	);

	const _onChangeFile = useCallback(
		(file: Uint8Array): void =>
		setJson(parseFile(file)), []
	);

	const _onRestore = useCallback(
		(): void => {
			if (!json || !password) { return; }
			jsonRestore(json, password);
		},
		[json, password]
	);

	return (
		<>
			<HeaderWithSmallerMargin
				text='Restore Account from JSON'
			/>
			<Address
				name={isJsonValid && json ? json.meta.name : null}
				address={isJsonValid && address ? address : null}
			/>
			<InputFile
				accept={acceptedFormats}
				help={'Select the JSON key file that was downloaded when you created the account. This JSON file contains your private key encrypted with your password.'}
				label={'backup file'}
				onChange={_onChangeFile}
				withLabel
			/>
			<InputWithLabel
				label='Password for this file'
				onChange={_onChangePass}
				type='password'
			/>
			<Button
				isDisabled={!isJsonValid || !isPassValid}
				onClick={_onRestore}
			>
				Restore
			</Button>
		</>
	);
}

function InputFile({ accept, clearContent, convertHex, help, isDisabled, isError = false, label, onChange, placeholder, withEllipsis, withLabel }: InputFileProps): React.ReactElement<InputFileProps> {
	const dropRef = createRef<DropzoneRef>();
	const [file, setFile] = useState<FileState | undefined>();

	const _onDrop = useCallback(
		(files: File[]): void => {
			files.forEach((file): void => {
				const reader = new FileReader();

				reader.onabort = NOOP;
				reader.onerror = NOOP;

				reader.onload = ({ target }: ProgressEvent<FileReader>): void => {
					if (target && target.result) {
						const name = file.name;
						const data = convertResult(target.result as ArrayBuffer, convertHex);

						onChange && onChange(data, name);
						dropRef && setFile({
							name,
							size: data.length
						});
					}
				};

				reader.readAsArrayBuffer(file);
			});
		},
		[convertHex, dropRef, onChange]
	);

	const dropZone = (
		<Dropzone
			accept={accept}
			disabled={isDisabled}
			multiple={false}
			onDrop={_onDrop}
			ref={dropRef}
		>
			{({ getInputProps, getRootProps }): JSX.Element => (
				<div {...getRootProps()} >
					<input {...getInputProps()} />
					<em className='label' >
						{
							!file || clearContent
								? placeholder || 'click to select or drag and drop the file here'
								: placeholder || `${ file.name } (${ formatNumber(file.size) } bytes)`
						}
					</em>
				</div>
			)}
		</Dropzone>
	);

	return dropZone
}

const NOOP = (): void => undefined;
const BYTE_STR_0 = '0'.charCodeAt(0);
const BYTE_STR_X = 'x'.charCodeAt(0);

function convertResult(result: ArrayBuffer, convertHex?: boolean): Uint8Array {
	const data = new Uint8Array(result);

	// this converts the input (if detected as hex), vai the hex conversion route
	if (convertHex && data[0] === BYTE_STR_0 && data[1] === BYTE_STR_X) {
		const hex = u8aToString(data);

		if (isHex(hex)) {
			return hexToU8a(hex);
		}
	}

	return data;
}

function parseFile(file: Uint8Array): JsonState {
	try {
		const json = JSON.parse(u8aToString(file));
		const address = json.address;
		const isJsonValid = true;

		return { address, isJsonValid, json };
	} catch (error) {
		console.error(error);
	}

	return { address: null, isJsonValid: false, json: null };
}

const HeaderWithSmallerMargin = styled(Header)`
  margin-bottom: 15px;
`;
