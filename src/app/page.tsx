'use client'
import React from "react";
import {styled} from '@mui/material/styles';
import {Box, Button, LinearProgress, Stack, Paper} from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import prettyBytes from 'pretty-bytes';
import {XMLParser} from "fast-xml-parser";
import { JSONPath } from '@astronautlabs/jsonpath';
import Grid from '@mui/material/Grid2';

import {Charstring, Cmap4, FontDict, OS2, TTXObject} from "@/app/TTXObject";
import {LayoutView} from "@/app/LayoutView";
import {jamoLayouts, ResizedGlyph} from "@/app/jamo_layouts";
import {initLayouts} from "@/app/init_layouts";
import {ResizedGlyphView} from "@/app/ResizedGlyphView";
import {parseGlyph, Point} from "@/app/parse_glyph";
import {Layer, Stage, Text} from "react-konva";
import {findCharstringByCodepoint, glyphActualBounds} from "@/app/font_utils";
import {uniToPua} from "@/app/pua_uni_conv";
import Konva from "konva";


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
            <Paper variant="outlined" sx={{ my: { xs: 2, md: 4 }, p: { xs: 1, md: 3 } }}>
                <Stack spacing={1}>
                    {file && <Box>File: {file.name}</Box>}

                    <Box display={"flex"}>
                        <Stack spacing={0}>
                            <Button
                                component="label"
                                role={undefined}
                                variant="outlined"
                                startIcon={<UploadFileIcon />}
                                loading={loadingState !== null && !loadDone}
                            >
                                Upload font file
                                <VisuallyHiddenInput
                                    type="file"
                                    onChange={(event) => handleFileChange(event)}
                                />
                            </Button>
                            {loadingState && !loadDone && <LinearProgress />}
                        </Stack>
                    </Box>

                    {loadingState && <Box>Loading: {loadingState}</Box>}
                </Stack>
            </Paper>

            {loadDone && ttx &&
                <CompositionLayouts
                    ttx={ttx}
                    origFilename={file ? `${file.name}` : "font.ttf"}
                />}
        </React.Fragment>
    );
}


function array<T>(x: T | Array<T>): Array<T> {
    if (Array.isArray(x)) {
        return x;
    }
    return [x];
}


function CompositionLayouts(
    {ttx, origFilename}: Readonly<{
        ttx: TTXObject,
        origFilename: string
    }>
) {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const fdarray = React.useRef<FontDict[]>(null);
    const charstrings = React.useRef<Charstring[]>(null);
    const os2 = React.useRef<OS2>(null);
    const cmap4 = React.useRef<Cmap4>(null);

    const [curLayouts, setCurLayouts] = React.useState(structuredClone(jamoLayouts));

    const debug = false;

    React.useEffect(() => {
        fdarray.current = array(JSONPath.query(ttx, '$.ttFont.CFF.CFFFont.FDArray.FontDict')[0]);
        charstrings.current = array(JSONPath.query(ttx, '$.ttFont.CFF.CFFFont.CharStrings.CharString')[0]);
        os2.current = JSONPath.query(ttx, '$.ttFont.OS_2')[0];
        cmap4.current = JSONPath.query(ttx, '$.ttFont.cmap.cmap_format_4[?(@.@_platformID == "0")]')[0];

        if (!debug) {
            console.log("Resetting layouts");
            setCurLayouts(initLayouts(
                cmap4.current as Cmap4,
                charstrings.current as Charstring[],
                fdarray.current as FontDict[],
                os2.current as OS2,
            ));
        }

        setIsLoaded(true);
    }, [ttx]);

    const [left, setLeft] = React.useState<number>(0);
    const [bottom, setBottom] = React.useState<number>(-200);
    const [viewWidth, setViewWidth] = React.useState<number>(1000);

    const ref = React.useRef<Konva.Text>(null);

    if (!isLoaded) {
        return <div>Loading...</div>;
    }
    else if (charstrings.current && fdarray.current && cmap4.current) {
        if (debug) {
            const aspectRatio = 1.;
            const canvasWidth = 600, canvasHeight = aspectRatio * 600;

            const minCanvasSide = Math.min(canvasWidth, canvasHeight);
            const scale = minCanvasSide / viewWidth;

            function rescale(p: Point): number[] {
                let x = (p.x - left) * scale;
                x = x === -Infinity ? 0 : (x === Infinity ? canvasWidth : x);
                let y = canvasHeight - (p.y - bottom) * scale;
                y = y === -Infinity ? 0 : (y === Infinity ? canvasHeight : y);

                return [x, y];
            }

            const cs = findCharstringByCodepoint(
                'ㄱ'.codePointAt(0) as number,
                cmap4.current,
                charstrings.current,
            );
            const glyph: ResizedGlyph = {
                glyph: parseGlyph(cs, fdarray.current),
                bounds: {left: 0.2, right: 0.8, top: 0.8, bottom: 0.2},
            }
            const bounds = {left: 0, right: 1000, top: 800, bottom: 600};
            const actualBounds = glyphActualBounds(glyph.glyph);
            const resizedBounds = glyph.bounds;
            const targetBounds = {
                left: bounds.left + resizedBounds.left * (bounds.right - bounds.left),
                right: bounds.left + resizedBounds.right * (bounds.right - bounds.left),
                top: bounds.bottom + resizedBounds.top * (bounds.top - bounds.bottom),
                bottom: bounds.bottom + resizedBounds.bottom * (bounds.top - bounds.bottom),
            }

            const xScale = (targetBounds.right - targetBounds.left) / (actualBounds.right - actualBounds.left);
            const yScale = (targetBounds.top - targetBounds.bottom) / (actualBounds.top - actualBounds.bottom);
            return (
                <Paper>
                    <Stage
                        width={canvasWidth}
                        height={canvasHeight}
                        onMouseMove={(e) => {
                            if (ref.current) {
                                const x = e.evt.offsetX / scale + left;
                                const y = (canvasHeight - e.evt.offsetY) / scale + bottom;
                                const rx = (x - targetBounds.left) / xScale + actualBounds.left;
                                const ry = (y - targetBounds.bottom) / yScale + actualBounds.bottom;
                                ref.current.position({x: e.evt.offsetX, y: e.evt.offsetY - 10});
                                ref.current.text(`${rx.toFixed(0)}, ${ry.toFixed(0)}`);
                            }
                        }}
                    >
                        <Layer>
                            <ResizedGlyphView
                                resizedGlyph={glyph}
                                rescale={rescale}
                                bounds={bounds}
                                showPoints={true}
                                strokeWidth={1}
                                stroke="grey"
                            />
                            <Text
                                ref={ref}
                                x={10}
                                y={10}
                                text={"Test"}
                                fontSize={10}
                                fill="grey"
                            />
                        </Layer>
                    </Stage>
                </Paper>
            );
        }
        else {
            return (
                <React.Fragment>
                    <Paper variant="outlined" sx={{my: {xs: 2, md: 4}, p: {xs: 1, md: 3}}}>
                        <ShowFontSummary
                            ttx={ttx}
                            origFilename={origFilename}
                        />
                    </Paper>

                    <Paper variant="outlined" sx={{my: {xs: 2, md: 4}, p: {xs: 1, md: 3}}}>
                        <Grid container spacing={2}>
                            {curLayouts.map((layout, idx) =>
                                <Grid key={idx} size={4}>
                                    <Paper variant="elevation">
                                        <LayoutView
                                            layout={layout}
                                            setLayout={(newLayout) => {
                                                setCurLayouts(
                                                    curLayouts.map((l, i) => i === idx ? newLayout : l)
                                                );
                                            }}
                                            otherLayouts={curLayouts}
                                            fdarray={fdarray.current as FontDict[]}
                                            charstrings={charstrings.current as Charstring[]}
                                            os2={os2.current as OS2}
                                            cmap4={cmap4.current as Cmap4}
                                            showPoints={false}
                                        />
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>
                </React.Fragment>
            );
        }
    }
}


function ShowFontSummary(
    {ttx, origFilename}: Readonly<{
        ttx: TTXObject,
        origFilename: string
    }>
) {
    const fontName = JSONPath.query(ttx, '$.ttFont.name.namerecord[?(@.@_nameID == "4")]')[0]['#text'];
    const fontVersion = JSONPath.query(ttx, '$.ttFont.name.namerecord[?(@.@_nameID == "5")]')[0]['#text'];
    const numberOfGlyphs = array(JSONPath.query(ttx, '$.ttFont.GlyphOrder.GlyphID')[0]).length;

    return (
        <Stack>
            <Box><strong>Font</strong>: {fontName}</Box>
            <Box><strong>Version</strong>: {fontVersion}</Box>
            <Box><strong>Number of glyphs</strong>: {numberOfGlyphs}</Box>
            <DownloadFontButton ttx={ttx} origFilename={origFilename}/>
        </Stack>
    );
}


function DownloadFontButton(
    {ttx, origFilename} : Readonly<{
        ttx: TTXObject;
        origFilename: string;
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
            const fileStream = streamSaver.createWriteStream(origFilename);

            let downloadLength = 0;
            await response.body
                ?.pipeThrough(new DecompressionStream('gzip'))
                .pipeThrough(new TransformStream({
                    transform(chunk, controller) {
                        downloadLength += chunk.length;
                        controller.enqueue(chunk);
                        setDownloadState("Downloading: " + prettyBytes(downloadLength));
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

    return (
        <Stack spacing={1}>
            <Box display={"flex"}>
                <Stack spacing={0}>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadFont()}
                        loading={downloadState !== null && !downloadDone}
                    >
                        Download font
                    </Button>
                    {downloadState && !downloadDone && <LinearProgress />}
                </Stack>
            </Box>
            {downloadState &&
                <Box>Download status: {downloadState}</Box>}
        </Stack>
    );
}