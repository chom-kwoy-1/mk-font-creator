'use client'
import React from "react";
import {styled} from '@mui/material/styles';
import {
    Box,
    Button,
    LinearProgress,
    Stack,
    Paper,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import prettyBytes from 'pretty-bytes';
import {XMLParser} from "fast-xml-parser";
import Grid from '@mui/material/Grid2';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import {Charstring, OS2, TTXWrapper} from "@/app/TTXObject";
import {LayoutView} from "@/app/LayoutView";
import {Category, Layouts, ResizedGlyph} from "@/app/jamo_layouts";
import {initLayouts} from "@/app/init_layouts";
import {ResizedGlyphView} from "@/app/ResizedGlyphView";
import {parseGlyph, Point} from "@/app/parse_glyph";
import {Layer, Stage, Text} from "react-konva";
import {findCharstringByCodepoint, glyphActualBounds} from "@/app/font_utils";
import Konva from "konva";
import {generateTtx} from "@/app/make_ttx";


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
                <CompositionLayouts
                    ttx={ttx}
                    curLayouts={curLayouts}
                    setCurLayouts={setCurLayouts}
                    origFilename={file ? `${file.name}` : "font.ttf"}
                />}
        </React.Fragment>
    );
}

function CompositionLayouts(
    {ttx, curLayouts, setCurLayouts, origFilename}: Readonly<{
        ttx: TTXWrapper,
        curLayouts: Layouts,
        setCurLayouts: (layouts: Layouts) => void,
        origFilename: string
    }>
) {
    const fdarray = ttx.getFDArray();
    const os2 = ttx.getOS2();

    const [left, setLeft] = React.useState<number>(0);
    const [bottom, setBottom] = React.useState<number>(-200);
    const [viewWidth, setViewWidth] = React.useState<number>(1000);

    const ref = React.useRef<Konva.Text>(null);

    const debug = false;
    if (debug) {
        const aspectRatio = 1.;
        const canvasWidth = 600;
        const canvasHeight = aspectRatio * canvasWidth;

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
            ttx,
        ) as Charstring;
        const glyph: ResizedGlyph = {
            glyph: parseGlyph(cs, fdarray),
            bounds: {left: 0.2, right: 0.8, top: 0.8, bottom: 0.2},
        }
        const bounds = {left: 0, right: 1000, top: 800, bottom: 300};
        const actualBounds = glyphActualBounds(glyph.glyph);
        const resizedBounds = glyph.bounds;
        const targetBounds = {
            left: bounds.left + resizedBounds.left * (bounds.right - bounds.left),
            right: bounds.left + resizedBounds.right * (bounds.right - bounds.left),
            top: bounds.bottom + resizedBounds.top * (bounds.top - bounds.bottom),
            bottom: bounds.bottom + resizedBounds.bottom * (bounds.top - bounds.bottom),
        };

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
                    }}>
                    <Layer>
                        <ResizedGlyphView
                            resizedGlyph={glyph}
                            rescale={rescale}
                            bounds={bounds}
                            showPoints={false}
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

    const layoutGrid = (
        <Grid container spacing={2}>
            {curLayouts.map((category, cidx) =>
                <Grid key={cidx} size={12}>
                    <LayoutCategory
                        category={category}
                        cidx={cidx}
                        curLayouts={curLayouts}
                        setCurLayouts={setCurLayouts}
                        os2={os2}
                    />
                </Grid>
            )}
        </Grid>
    );

    return (
        <React.Fragment>
            <Paper variant="outlined" sx={{my: {xs: 2, md: 4}, p: {xs: 1, md: 3}}}>
                <Stack>
                    <ShowFontSummary ttx={ttx}/>
                    <DownloadFontButton
                        ttx={ttx}
                        curLayouts={curLayouts}
                        origFilename={origFilename}
                    />
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{my: {xs: 2, md: 4}, p: {xs: 1, md: 3}}}>
                {layoutGrid}
            </Paper>
        </React.Fragment>
    );
}


function LayoutCategory(
    {category, cidx, curLayouts, setCurLayouts, os2}: Readonly<{
        category: Category;
        cidx: number;
        curLayouts: Layouts;
        setCurLayouts: (layouts: Layouts) => void;
        os2: OS2;
    }>
) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [expandedOnce, setExpandedOnce] = React.useState(false);

    return (
        <Accordion
            expanded={isExpanded}
            onChange={(e, expanded) => {
                setIsExpanded(expanded);
                setExpandedOnce(expanded || expandedOnce);
            }}
        >
            <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                <Typography variant="h6">
                    {category.category_name}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                {expandedOnce &&
                    <Grid container spacing={2}>
                        {category.layouts.map((layout, idx) =>
                            <Grid key={idx} size={3}>
                                <Paper variant="elevation">
                                    <LayoutView
                                        layout={layout}
                                        setLayout={(newLayout) => {
                                            const newCategory = {
                                                ...category,
                                                layouts: category.layouts.map(
                                                    (layout, li) => li === idx ? newLayout : layout
                                                )
                                            };
                                            const newLayouts = curLayouts.map(
                                                (category, ci) => ci === cidx ? newCategory : category
                                            );
                                            setCurLayouts(newLayouts);
                                        }}
                                        layoutTag={category.tag}
                                        allLayouts={curLayouts}
                                        os2={os2}
                                        showPoints={false}
                                    />
                                </Paper>
                            </Grid>
                        )}
                    </Grid>}
            </AccordionDetails>
        </Accordion>
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


function DownloadFontButton(
    {ttx, curLayouts, origFilename}: Readonly<{
        ttx: TTXWrapper;
        curLayouts: Layouts;
        origFilename: string;
    }>
) {
    const [downloadState, setDownloadState] = React.useState<string | null>(null);
    const [downloadDone, setDownloadDone] = React.useState<boolean>(false);

    const workerRef = React.useRef<Worker>(null);
    React.useEffect(() => {
        workerRef.current = new Worker(new URL("../xml_serializer_worker.ts", import.meta.url));
        workerRef.current.onmessage = (event: MessageEvent<number>) =>
            alert(`WebWorker Response => ${typeof (event.data)}`);
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

            const modifiedTtx = generateTtx(ttx, curLayouts);

            const blob: Blob = await new Promise((resolve, reject) => {
                if (!workerRef.current) {
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
                workerRef.current?.postMessage(modifiedTtx);
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
        } catch (err) {
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
                        startIcon={<DownloadIcon/>}
                        onClick={() => downloadFont()}
                        loading={downloadState !== null && !downloadDone}
                    >
                        Download font
                    </Button>
                    {downloadState && !downloadDone && <LinearProgress/>}
                </Stack>
            </Box>
            {downloadState &&
                <Box>Download status: {downloadState}</Box>}
        </Stack>
    );
}