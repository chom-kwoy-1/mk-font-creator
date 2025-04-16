'use client'
import React from "react";
import { styled } from '@mui/material/styles';
import {Box, Button, LinearProgress} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function Home() {
    const [file, setFile] = React.useState<File | null>(null);
    const [loadingState, setLoadingState] = React.useState<string | null>(null);
    const [loadDone, setLoadDone] = React.useState<boolean>(false);
    const [doc, setDoc] = React.useState<Document | null>(null);

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files.length > 0) {
            // Reset state
            setLoadDone(false);
            setLoadingState(null);
            setDoc(null);

            const newFile = event.target.files[0];
            setFile(newFile);

            const formData = new FormData();
            formData.append('file', newFile as Blob);

            setLoadingState("Uploading file");
            const response = await fetch('/api/convert_font', {
                method: 'POST',
                body: formData,
            });
            setLoadingState("Processing response");

            if (response.body instanceof ReadableStream) {
                const stream = response.body;  // get gzip stream

                const reader = stream.pipeThrough(new DecompressionStream('gzip')).getReader();

                let length = 0;
                let text = "";
                const decoder = new TextDecoder();
                while (true) {
                    const {value, done} = await reader.read();  // start reading
                    if (done) {
                        setLoadingState("Downloaded: " + length + " bytes");
                        break;
                    }

                    length += value.length;
                    setLoadingState("Downloading: " + length + " bytes");

                    text += decoder.decode(value);
                }

                setLoadingState("Parsing XML...");
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/xml');
                setLoadingState("Loading Done.");

                setDoc(doc);
                setLoadDone(true);
            }
            else {
                await response.json().then((data) => {
                    console.error(data);  // TODO: Show error to user
                }).catch((err) => {
                    console.error(err);  // TODO: Show error to user
                });
            }
        }
    }

    return (
        <React.Fragment>
            {file && <p>File: {file.name}</p>}
            <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
                loading={loadingState !== null && !loadDone}
            >
                Upload font file
                <VisuallyHiddenInput
                    type="file"
                    onChange={(event) => handleFileChange(event)}
                />
            </Button>
            {loadingState && <Box>
                {!loadDone && <LinearProgress />}
                Loading: {loadingState}
            </Box>}
            {loadDone && doc && <ShowFontContents doc={doc} />}
        </React.Fragment>
    );
}


function ShowFontContents({doc}: {doc: Document}) {
    return (
        <React.Fragment>
            <p><strong>Font</strong>: {doc.querySelector('namerecord[nameID="4"]')?.innerHTML}</p>
            <p><strong>Version</strong>: {doc.querySelector('namerecord[nameID="5"]')?.innerHTML}</p>
            <p><strong>Number of glyphs</strong>: {doc.querySelectorAll('GlyphID').length}</p>
        </React.Fragment>
    );
}
