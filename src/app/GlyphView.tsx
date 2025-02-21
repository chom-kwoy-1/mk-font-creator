import React from 'react';
import {Line} from 'react-konva';
import {Glyph, Point} from "@/app/parse_glyph";
import Konva from "konva";

export function GlyphView(
    {glyph, rescale, ...props}: Readonly<{
        glyph: Glyph,
        rescale: (p: Point) => number[],
    } & Konva.LineConfig>
) {
    return (
        <React.Fragment>
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
                        {...props}
                    />
                );
            })}
        </React.Fragment>
    );
}
