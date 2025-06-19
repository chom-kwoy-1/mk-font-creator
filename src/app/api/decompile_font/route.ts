'use server'
import * as child_process from "node:child_process";
import {FileResult, fileSync} from "tmp";
import * as fs from "fs";
import {makeByteReadableStreamFromNodeReadable} from 'node-readable-to-web-readable-stream';
import {ChildProcess} from "node:child_process";

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

        console.log("Writing font to file: " + tmpFileOrNull.name);

        const reader = inputFile.stream().getReader();
        while (true) {
            const {value, done} = await reader.read();  // start reading
            if (done) {
                break;
            }

            outputStream.write(value);
        }

        console.log("Font file written to: " + tmpFileOrNull.name);

        const [process, result] = convertFontToTtx(tmpFileOrNull.name);
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

        // const stream = fs.createReadStream("C:\\Users\\mujji\\Documents\\SunBatang-Light.ttx");
        // const result = makeByteReadableStreamFromNodeReadable(stream)
        //     .pipeThrough(new CompressionStream("gzip"));

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

function convertFontToTtx(inputFileName: string): [ChildProcess, ReadableStream<Uint8Array>] {
    const ttx_converter = child_process.spawn(
        "ttx", [inputFileName, "-o", "-"],
        { env: { ...process.env, PYTHONIOENCODING: "utf-8" } }
    );

    ttx_converter.stderr.on("data", (data) => {
        data = "" + data;
        if (!data.includes('WARNING')) {
            console.error(`ttx: ${data.trimEnd()}`);
        }
    });

    return [ttx_converter, makeByteReadableStreamFromNodeReadable(ttx_converter.stdout)];
}
