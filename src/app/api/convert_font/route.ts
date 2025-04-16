'use server'
import * as child_process from "node:child_process";
import {FileResult, fileSync} from "tmp";
import * as fs from "fs";
import {makeByteReadableStreamFromNodeReadable} from 'node-readable-to-web-readable-stream';

export async function POST(req: Request) {
    let tmpFileOrNull: FileResult | null = null;
    try {
        const data = await req.formData();
        const inputFile = data.get('file');

        if (inputFile == null || !(inputFile instanceof File)) {
            throw new Error("Invalid file");
        }

        tmpFileOrNull = fileSync();

        // Write the file to a temporary location
        const outputStream = fs.createWriteStream(tmpFileOrNull.name);

        console.log("Writing to file: " + tmpFileOrNull.name);

        const reader = inputFile.stream().getReader();
        function handleChunk({ value, done }: ReadableStreamReadResult<Uint8Array<ArrayBufferLike>>) {
            if (done) {
                return;
            }
            outputStream.write(value);

            // retreive next chunk
            reader.read().then(handleChunk);
        }
        await reader.read().then(handleChunk);  // start reading

        console.log("File written to: " + tmpFileOrNull.name);

        const result = convertFont(tmpFileOrNull.name).pipeThrough(new CompressionStream("gzip"));

        return new Response(result);
    }
    catch (err) {
        let message = "Unknown Error";
        if (err instanceof Error) {
            message = err.message;
        }
        return Response.json({ error: message }, { status: 500 });
    }
    finally {
        if (tmpFileOrNull != null) {
            console.log("Removing temporary file: " + tmpFileOrNull.name);
            tmpFileOrNull.removeCallback();
        }
    }
}

function convertFont(inputFileName: string): ReadableStream<Uint8Array> {
    const ttx_converter = child_process.spawn("ttx", [inputFileName, "-o", "-"]);

    return makeByteReadableStreamFromNodeReadable(ttx_converter.stdout);
}
