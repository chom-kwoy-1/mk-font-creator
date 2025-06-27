'use client'
import React from "react";
import {styled} from '@mui/material/styles';
import {Box, Button, LinearProgress, Paper, Stack} from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import prettyBytes from 'pretty-bytes';
import {XMLParser} from "fast-xml-parser";

import {TTXWrapper} from "@/app/TTXObject";
import {Layouts} from "@/app/jamo_layouts";
import {initLayouts} from "@/app/init_layouts";
import {DownloadFontButton} from "@/app/DownloadFontButton";
import {CompositionLayouts} from "@/app/CompositionLayouts";


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
    const [ttx, setTTX] = React.useState<TTXWrapper | null>(null);
    const [curLayouts, setCurLayouts] = React.useState<Layouts | null>(null);

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files.length > 0) {
            // Reset state
            setLoadDone(false);
            setLoadingState(null);
            setTTX(null);

            const newFile = event.target.files[0];
            setFile(newFile);

            const formData = new FormData();
            formData.append('file', newFile as Blob);

            setLoadingState("Uploading file");
            const response = await fetch('/api/decompile_font', {
                method: 'POST',
                body: formData,
            });
            setLoadingState("Processing response");

            if (response.body instanceof ReadableStream) {
                const stream = response.body;  // get gzip stream

                const reader = stream
                    .pipeThrough(new DecompressionStream('gzip'))
                    .pipeThrough(new TextDecoderStream())
                    .getReader();

                let length = 0;
                let text = "";
                while (true) {
                    const {value, done} = await reader.read();  // start reading
                    if (done) {
                        setLoadingState("Downloaded: " + prettyBytes(length));
                        break;
                    }

                    length += value.length;
                    setLoadingState("Downloading: " + prettyBytes(length));

                    text += value;
                }

                setLoadingState("Parsing XML...");

                const parser = new XMLParser({
                    alwaysCreateTextNode: true,
                    ignoreAttributes: false,
                    isArray: (name, jpath, isLeafNode, isAttribute) => {
                        return !isAttribute;
                    }
                });
                const doc = parser.parse(text);
                const ttx = new TTXWrapper(doc);
                console.log(ttx);

                setLoadingState("Initializing layouts...");

                setTTX(ttx);
                setCurLayouts(initLayouts(ttx));
                setLoadDone(true);

                setLoadingState("Loading Done.");
            } else {
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
            <Paper variant="outlined" sx={{my: {xs: 2, md: 4}, p: {xs: 1, md: 3}}}>
                <Stack spacing={1}>
                    {file && <Box>File: {file.name}</Box>}

                    <Box display={"flex"}>
                        <Stack spacing={0}>
                            <Button
                                component="label"
                                role={undefined}
                                variant="outlined"
                                startIcon={<UploadFileIcon/>}
                                loading={loadingState !== null && !loadDone}
                            >
                                Upload font file
                                <VisuallyHiddenInput
                                    type="file"
                                    onChange={(event) => handleFileChange(event)}
                                />
                            </Button>
                            {loadingState && !loadDone && <LinearProgress/>}
                        </Stack>
                    </Box>

                    {loadingState && <Box>Loading: {loadingState}</Box>}
                </Stack>
            </Paper>

            {loadDone && ttx && curLayouts &&
                <React.Fragment>
                    <Paper variant="outlined" sx={{my: {xs: 2, md: 4}, p: {xs: 1, md: 3}}}>
                        <Stack>
                            <ShowFontSummary ttx={ttx}/>
                            <DownloadFontButton
                                ttx={ttx}
                                curLayouts={curLayouts}
                                origFilename={file ? `${file.name}` : "font.ttf"}
                            />
                        </Stack>
                    </Paper>

                    <CompositionLayouts
                        ttx={ttx}
                        curLayouts={curLayouts}
                        setCurLayouts={setCurLayouts}
                    />
                </React.Fragment>}
        </React.Fragment>
    );
}

function ShowFontSummary(
    {ttx}: Readonly<{ ttx: TTXWrapper }>
) {
    const fontName = ttx.getFontName();
    const fontVersion = ttx.getFontVersion();
    const numberOfGlyphs = ttx.getNumberOfGlyphs();

    return (
        <Stack>
            <Box><strong>Font</strong>: {fontName}</Box>
            <Box><strong>Version</strong>: {fontVersion}</Box>
            <Box><strong>Number of glyphs</strong>: {numberOfGlyphs}</Box>
        </Stack>
    );
}
