'use client'
import React from 'react';
import {Box} from "@mui/material";
import { Stage, Layer, Rect, Text, Circle, Line } from 'react-konva';
import {parse_glyph, Point} from "./parse_glyph";

type Charstring = {
    '@_name': string,
    '@_fdSelectIndex': string,
    '#text': string,
};

type FontDict = {
    Private: {
        defaultWidthX: { '@_value': string },
        nominalWidthX: { '@_value': string },
    },
};

type OS2 = {
    sTypoAscender: { '@_value': string },
    sTypoDescender: { '@_value': string },
};

export function GlyphView(
    {charstring, fdarray, os2}: Readonly<{
        charstring: Charstring;
        fdarray: FontDict[];
        os2: OS2;
    }>
) {
    const char_name = charstring['@_name'];
    const fd_select_index = parseInt(charstring['@_fdSelectIndex']);
    const font_dict = fdarray[fd_select_index];
    const default_width = parseInt(font_dict.Private.defaultWidthX['@_value']);
    const nominal_width = parseInt(font_dict.Private.nominalWidthX['@_value']);
    const ascender = parseInt(os2.sTypoAscender['@_value']);
    const descender = parseInt(os2.sTypoDescender['@_value']);

    const lines = charstring['#text'].split("\n").map((line) => {
        return line.trim().split(' ').map((token) => {
            const num = parseInt(token);
            return Number.isNaN(num) ? token : num;
        });
    });

    const glyph = parse_glyph(default_width, nominal_width, lines);

    console.log("lines", lines);
    console.log("glyph", glyph);

    const canvas_width = 500, canvas_height = 400;
    const left = -250, bottom = -400, view_width = 1500;

    function rescale(p: Point): number[] {
        const min_canvas_side = Math.min(canvas_width, canvas_height);
        const scale = min_canvas_side / view_width;

        let x = (p.x - left) * scale;
        x = x === -Infinity? 0 : (x === Infinity? canvas_width : x);
        let y = canvas_height - (p.y - bottom) * scale;
        y = y === -Infinity? 0 : (y === Infinity? canvas_height : y);

        return [x, y];
    }

    return (
        <React.Fragment>
            <strong>Char</strong>: {char_name}
            <Box>
                <Box style={{ border: "1px solid black", display: 'inline-block' }}>
                    <Stage
                        width={canvas_width}
                        height={canvas_height}
                    >
                        {/* Draw Glyph */}
                        <Layer>
                            {glyph.paths.map((path, path_idx) => {
                                return (
                                    <Line
                                        key={path_idx}
                                        points={[
                                            ...rescale(path.start),
                                            ...path.segments.flatMap((segment) => {
                                                return [
                                                    ...rescale(segment.ct1),
                                                    ...rescale(segment.ct2),
                                                    ...rescale(segment.p)
                                                ];
                                            }),
                                            ...rescale(path.start),
                                            ...rescale(path.start),
                                            ...rescale(path.start),
                                        ]}
                                        stroke="black"
                                        bezier={true}
                                    />
                                );
                            })}
                        </Layer>

                        {/* Draw Guides */}
                        <Layer>
                            <Line
                                points={[
                                    ...rescale({ x: 0, y: -Infinity }),
                                    ...rescale({ x: 0, y: Infinity }),
                                ]}
                                stroke="blue"
                                strokeWidth={1}
                            />
                            <Line
                                points={[
                                    ...rescale({ x: glyph.width, y: -Infinity }),
                                    ...rescale({ x: glyph.width, y: Infinity }),
                                ]}
                                stroke="blue"
                                strokeWidth={1}
                            />
                            <Line
                                points={[
                                    ...rescale({ x: -Infinity, y: 0 }),
                                    ...rescale({ x: Infinity, y: 0 }),
                                ]}
                                stroke="brown"
                                strokeWidth={1}
                            />
                            <Line
                                points={[
                                    ...rescale({ x: -Infinity, y: ascender }),
                                    ...rescale({ x: Infinity, y: ascender }),
                                ]}
                                stroke="blue"
                                strokeWidth={1}
                            />
                            <Line
                                points={[
                                    ...rescale({ x: -Infinity, y: descender }),
                                    ...rescale({ x: Infinity, y: descender }),
                                ]}
                                stroke="blue"
                                strokeWidth={1}
                            />
                        </Layer>
                    </Stage>
                </Box>
            </Box>
            <pre>{charstring['#text'].split('\n').map((line) => line.trim()).join('\n')}</pre>
        </React.Fragment>
    );
}
