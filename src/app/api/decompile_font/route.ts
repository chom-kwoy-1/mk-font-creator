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

        // const result = convertFont(tmpFileOrNull.name)
        //     .pipeThrough(new CompressionStream("gzip"));

        const stream = fs.createReadStream("C:\\Users\\mujji\\Documents\\SunBatang-Light.ttx");
        const result = makeByteReadableStreamFromNodeReadable(stream)
            .pipeThrough(new CompressionStream("gzip"));

        return new Response(result);
    }
    catch (err) {
        let message = "Unknown Error";
        if (err instanceof Error) {
            console.error(err);
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
    const ttx_converter = child_process.spawn(
        "ttx", [inputFileName, "-o", "-"],
        { env: { ...process.env, PYTHONIOENCODING: "utf-8" } }
    );

    ttx_converter.stderr.on("data", (data) => {
        console.error(`ttx_converter stderr: ${data}`);
    });

    return makeByteReadableStreamFromNodeReadable(ttx_converter.stdout);
}
