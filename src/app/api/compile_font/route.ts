'use server'

import {FileResult, fileSync} from "tmp";
import fs from "fs";
import child_process, {ChildProcess} from "node:child_process";
import {makeByteReadableStreamFromNodeReadable} from "node-readable-to-web-readable-stream";

export async function POST(req: Request) {
    let tmpFileOrNull: FileResult | null = null;
    try {
        const inputFile = req.body;
        if (inputFile == null) {
            throw new Error("Invalid request");
        }

        tmpFileOrNull = fileSync();

        // Write the file to a temporary location
        const outputStream = fs.createWriteStream(tmpFileOrNull.name);

        console.log("Writing TTX to file: " + tmpFileOrNull.name);

        const reader = inputFile
            .pipeThrough(new DecompressionStream('gzip'))
            .getReader();

        while (true) {
            const {value, done} = await reader.read();  // start reading
            if (done) {
                break;
            }

            outputStream.write(value);
        }

        console.log("TTX file written to: " + tmpFileOrNull.name);

        const [process, result] = convertTtxToFont(tmpFileOrNull.name);
        process.on('close', (code) => {
            if (code !== 0) {
                console.error(`ttx process exited with code ${code}`);
                // TODO: get this error to the client
            }
            if (tmpFileOrNull !== null) {
                console.log("Removing temporary file: " + tmpFileOrNull.name);
                tmpFileOrNull.removeCallback();
            }
        });

        return new Response(result.pipeThrough(new CompressionStream("gzip")));
    }
    catch (err) {
        let message = "Unknown Error";
        if (err instanceof Error) {
            console.error(err);
            message = err.message;
        }
        return Response.json({ error: message }, { status: 500 });
    }
}

function convertTtxToFont(inputFileName: string): [ChildProcess, ReadableStream<Uint8Array>] {
    const ttx_converter = child_process.spawn(
        "ttx",
        ["-o", "-", inputFileName],
    );

    ttx_converter.stderr.on("data", (data) => {
        data = "" + data;
        if (!data.includes('WARNING')) {
            console.error(`ttx: ${data.trimEnd()}`);
        }
    });

    return [ttx_converter, makeByteReadableStreamFromNodeReadable(ttx_converter.stdout)];
}
