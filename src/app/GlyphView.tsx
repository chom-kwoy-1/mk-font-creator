import React from 'react';
import { Layer, Line } from 'react-konva';
import {Glyph, Point} from "@/app/parse_glyph";

export function GlyphView(
    {glyph, rescale}: Readonly<{
        glyph: Glyph,
        rescale: (p: Point) => number[],
    }>
) {
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
