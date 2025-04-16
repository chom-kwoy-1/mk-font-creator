'use client'
import React from "react";
import {styled} from '@mui/material/styles';
import {Box, Button, LinearProgress} from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import prettyBytes from 'pretty-bytes';
import {XMLParser} from "fast-xml-parser";
import { JSONPath } from '@astronautlabs/jsonpath';
import {TTXObject} from "./TTXObject";
import {GlyphView} from "@/app/GlyphView";


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
    const [ttx, setTTX] = React.useState<TTXObject | null>(null);

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
                    ignoreAttributes : false,
                });
                const doc = parser.parse(text);

                setLoadingState("Loading Done.");

                console.log(doc);
                setTTX(doc);
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
                startIcon={<UploadFileIcon />}
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
                <p>Loading: {loadingState}</p>
            </Box>}

            {loadDone && ttx && <ShowFontContents
                ttx={ttx}
                orig_filename={file ? `${file.name}` : "font.ttf"}
            />}
        </React.Fragment>
    );
}


function ShowFontContents(
    {ttx, orig_filename}: Readonly<{
        ttx: TTXObject,
        orig_filename: string
    }>
) {
    const [downloadState, setDownloadState] = React.useState<string | null>(null);
    const [downloadDone, setDownloadDone] = React.useState<boolean>(false);

    const workerRef = React.useRef<Worker>(null);
    React.useEffect(() => {
        workerRef.current = new Worker(new URL("../xml_serializer_worker.ts", import.meta.url));
        workerRef.current.onmessage = (event: MessageEvent<number>) =>
            alert(`WebWorker Response => ${typeof(event.data)}`);
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    async function downloadFont() {
        if (!ttx || !workerRef.current) {
            return;
        }

        try {
            setDownloadDone(false);
            setDownloadState("Preparing download...");

            const blob: Blob = await new Promise((resolve, reject) => {
                if (!ttx || !workerRef.current) {
                    reject("No document or worker");
                    return;
                }
                workerRef.current.onmessage = (event: MessageEvent<Blob>) => {
                    if (event.data instanceof Blob) {
                        resolve(event.data);
                        return;
                    }
                    setDownloadState(event.data as string);
                }
                workerRef.current?.postMessage(ttx);
            });

            setDownloadState("Compiling font...");

            // Send the compressed XML to the server
            const response = await fetch('/api/compile_font', {
                method: 'POST',
                body: blob,
            });

            const streamSaver = await import('streamsaver');
            const fileStream = streamSaver.createWriteStream(orig_filename);

            let download_length = 0;
            await response.body
                ?.pipeThrough(new DecompressionStream('gzip'))
                .pipeThrough(new TransformStream({
                    transform(chunk, controller) {
                        download_length += chunk.length;
                        controller.enqueue(chunk);
                        setDownloadState("Downloading: " + prettyBytes(download_length));
                    },
                }))
                .pipeTo(fileStream);

            setDownloadState("Download complete");
            setDownloadDone(true);
        }
        catch (err) {
            console.error(err);
            setDownloadState("Error: " + err);
        }
    }

    function array<T>(x: T | Array<T>): Array<T> {
        if (Array.isArray(x)) {
            return x;
        }
        return [x];
    }

    const font_name = JSONPath.query(ttx, '$.ttFont.name.namerecord[?(@.@_nameID == "4")]')[0]['#text'];
    const font_version = JSONPath.query(ttx, '$.ttFont.name.namerecord[?(@.@_nameID == "5")]')[0]['#text'];
    const number_of_glyphs = array(JSONPath.query(ttx, '$.ttFont.GlyphOrder.GlyphID')[0]).length;

    const fdarray = array(JSONPath.query(ttx, '$.ttFont.CFF.CFFFont.FDArray.FontDict')[0]);
    const charstrings = array(JSONPath.query(ttx, '$.ttFont.CFF.CFFFont.CharStrings.CharString')[0]);
    const os2 = JSONPath.query(ttx, '$.ttFont.OS_2')[0];

    return (
        <React.Fragment>
            <p><strong>Font</strong>: {font_name}</p>
            <p><strong>Version</strong>: {font_version}</p>
            <p><strong>Number of glyphs</strong>: {number_of_glyphs}</p>
            <GlyphView charstring={charstrings[10377]} fdarray={fdarray} os2={os2} />
            <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => downloadFont()}
                loading={downloadState !== null && !downloadDone}
            >
                Download font
            </Button>
            {downloadState && <Box>
                {!downloadDone && <LinearProgress />}
                <p>Download status: {downloadState}</p>
            </Box>}
        </React.Fragment>
    );
}
