import {XMLBuilder} from "fast-xml-parser";
import prettyBytes from "pretty-bytes";

addEventListener("message", async (event: MessageEvent<Document>) => {

    const builder = new XMLBuilder({
        ignoreAttributes : false,
    });
    const xml = builder.build(event.data);

    postMessage("Compressing XML...");

    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(xml);
            controller.close();
        },
    })
        .pipeThrough(new TextEncoderStream())
        .pipeThrough(new CompressionStream('gzip'))
        .getReader();

    // Compress the XML
    let compress_length = 0;
    const bytes = [];
    while (true) {
        const {value, done} = await stream.read();
        if (done) {
            break;
        }

        compress_length += value.length;
        bytes.push(value);

        postMessage("Compressing: " + prettyBytes(compress_length));
    }

    // Convert to a Blob
    const blob = new Blob(bytes, {type: 'application/gzip'});

    postMessage(blob);
});
