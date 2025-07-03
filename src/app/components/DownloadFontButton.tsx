import {TTXWrapper} from "@/app/font_utils/TTXObject";
import {Layouts} from "@/app/font_utils/jamo_layouts";
import React from "react";
import {generateTtx, OrientationMode} from "@/app/font_utils/make_ttx";
import prettyBytes from "pretty-bytes";
import {Box, Button, FormControlLabel, LinearProgress, Radio, RadioGroup, Stack} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

export function DownloadFontButton(
    {ttx, curLayouts, origFilename}: Readonly<{
        ttx: TTXWrapper;
        curLayouts: Layouts;
        origFilename: string;
    }>
) {
    const [downloadState, setDownloadState] = React.useState<string | null>(null);
    const [downloadDone, setDownloadDone] = React.useState<boolean>(false);
    const [orientationMode, setOrientationMode] = React.useState<OrientationMode>("horz-and-vert");

    const workerRef = React.useRef<Worker>(null);
    React.useEffect(() => {
        workerRef.current = new Worker(new URL("../../xml_serializer_worker.ts", import.meta.url));
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

            const modifiedTtx = generateTtx(ttx, curLayouts, orientationMode);

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

            let downloadLength = 0;
            const stream = response.body
                ?.pipeThrough(new DecompressionStream('gzip'))
                .pipeThrough(new TransformStream({
                    transform(chunk, controller) {
                        downloadLength += chunk.length;
                        controller.enqueue(chunk);
                        setDownloadState("Downloading: " + prettyBytes(downloadLength));
                    },
                }));

            if (!stream) {
                throw new Error("Invalid Response body");
            }

            const downloadedBlob = await readableStreamToBlob(stream);
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(downloadedBlob);
            link.download = origFilename;
            link.click();
            link.remove();

            setDownloadState("Download complete");
            setDownloadDone(true);
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.name, err.message, err.cause, err.stack);
            }
            setDownloadState("Error: " + err);
        }
    }

    return (
        <Stack spacing={1}>
            <Box display={"flex"}>
                <Stack direction="row" spacing={3} alignItems={"center"}>
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
                    <RadioGroup
                        row
                        value={orientationMode}
                        onChange={(e) => setOrientationMode(e.target.value as OrientationMode)}
                    >
                        <FormControlLabel value="horz-and-vert" control={<Radio/>} label="가로쓰기 (+세로)"/>
                        <FormControlLabel value="vert-only" control={<Radio/>} label="세로쓰기 전용"/>
                    </RadioGroup>
                </Stack>
            </Box>
            {downloadState &&
                <Box>Download status: {downloadState}</Box>}
        </Stack>
    );
}

async function readableStreamToBlob(
    readableStream: ReadableStream<any>,
    mimeType: string | null = null
) {
    // Create a Response object from the ReadableStream
    const response = new Response(readableStream, {
        headers: { 'Content-Type': mimeType || 'application/octet-stream' }
    });

    // Get the Blob from the Response object
    return await response.blob();
}
