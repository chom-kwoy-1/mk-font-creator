import React from 'react';
import { Layer, Line } from 'react-konva';
import {parseGlyph, Point} from "./parse_glyph";
import {Charstring, FontDict} from "./TTXObject";

export function GlyphView(
    {charstring, fdarray, rescale}: Readonly<{
        charstring: Charstring;
        fdarray: FontDict[];
        rescale: (p: Point) => number[],
    }>
) {
    const fdSelectIndex = parseInt(charstring['@_fdSelectIndex']);
    const fontDict = fdarray[fdSelectIndex];
    const defaultWidth = parseInt(fontDict.Private.defaultWidthX['@_value']);
    const nominalWidth = parseInt(fontDict.Private.nominalWidthX['@_value']);

    const lines = charstring['#text'].split("\n").map((line) => {
        return line.trim().split(' ').map((token) => {
            const num = parseInt(token);
            return Number.isNaN(num) ? token : num;
        });
    });

    const glyph = parseGlyph(defaultWidth, nominalWidth, lines);

    return (
        <Layer>
            {glyph.paths.map((path, pathIdx) => {
                return (
                    <Line
                        key={pathIdx}
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
    );
}
