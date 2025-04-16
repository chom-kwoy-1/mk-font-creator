import React from 'react';
import {Circle, Line, Rect} from 'react-konva';
import {Glyph, Point} from "@/app/parse_glyph";
import Konva from "konva";

export function GlyphView(
    {glyph, rescale, ...props}: Readonly<{
        glyph: Glyph,
        rescale: (p: Point) => number[],
        showPoints?: boolean,
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
            {props.showPoints? glyph.paths.map((path, pathIdx) => {
                const points = [path.start, ...path.segments.map((segment) => segment.p)];
                const controls = path.segments.flatMap((segment) => [segment.ct1, segment.ct2]);
                return (
                    <React.Fragment key={pathIdx}>
                        {points.map((point, pointIdx) => {
                            return (
                                <Rect
                                    key={pointIdx}
                                    x={rescale(point)[0] - 2}
                                    y={rescale(point)[1] - 2}
                                    width={4}
                                    height={4}
                                    stroke="blue"
                                    strokeWidth={1}
                                />
                            );
                        })}
                        {controls.map((control, controlIdx) => {
                            return (
                                <Circle
                                    key={controlIdx}
                                    x={rescale(control)[0]}
                                    y={rescale(control)[1]}
                                    radius={2}
                                    stroke="brown"
                                    strokeWidth={1}
                                />
                            );
                        })}
                    </React.Fragment>
                )
            }) : null}
        </React.Fragment>
    );
}
