import React from 'react';
import {Circle, Group, Line, Rect, Text} from 'react-konva';
import {Glyph, Point} from "@/app/parse_glyph";
import Konva from "konva";
import {Bezier} from "bezier-js";

export function GlyphView(
    {stageRef, glyph, rescale, ...props}: Readonly<{
        stageRef: React.RefObject<Konva.Group | null>,
        glyph: Glyph,
        rescale: (p: Point) => number[],
        showPoints?: boolean,
    } & Konva.LineConfig>
) {
    return (
        <Group ref={stageRef}>
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
                        bezier={true}
                        {...props}
                    />
                );
            })}
            {props.showPoints? glyph.paths.map((path, pathIdx) => {
                const points = [path.start, ...path.segments.map((segment) => segment.p)];
                const controls = path.segments.flatMap((segment) => [segment.ct1, segment.ct2]);
                const ctLines = [];
                const texts = [];
                let lastPoint = path.start;
                let idx = 0;
                for (const segment of path.segments) {
                    const bezier = new Bezier(structuredClone([
                        lastPoint, segment.ct1, segment.ct2, segment.p
                    ]));
                    const mid = bezier.get(0.5);
                    texts.push(
                        <Text
                            key={idx}
                            x={rescale(mid)[0]}
                            y={rescale(mid)[1]}
                            text={`${idx}`}
                            fontSize={7}
                            fill={["#dddd33", "#33dddd", "#dd33dd"][pathIdx % 3]}
                            align={"center"}
                            verticalAlign={"middle"}
                        />
                    )
                    ctLines.push(
                        <Line
                            key={ctLines.length}
                            points={[
                                ...rescale(lastPoint),
                                ...rescale(segment.ct1),
                            ]}
                            stroke="#aa2222"
                            dash={[3, 2]}
                            strokeWidth={1}
                        />
                    );
                    ctLines.push(
                        <Line
                            key={ctLines.length}
                            points={[
                                ...rescale(segment.p),
                                ...rescale(segment.ct2),
                            ]}
                            stroke="#666666"
                            dash={[3, 2]}
                            strokeWidth={1}
                        />
                    );
                    lastPoint = segment.p;
                    idx += 1;
                }

                return (
                    <React.Fragment key={pathIdx}>
                        {ctLines}
                        {controls.map((control, controlIdx) => {
                            return (
                                <Circle
                                    key={controlIdx}
                                    x={rescale(control)[0]}
                                    y={rescale(control)[1]}
                                    radius={2}
                                    stroke="#aaaaaa"
                                    strokeWidth={1}
                                />
                            );
                        })}
                        {points.map((point, pointIdx) => {
                            const r = pointIdx == 0? 4 : 2;
                            return (
                                <Rect
                                    key={pointIdx}
                                    x={rescale(point)[0] - r}
                                    y={rescale(point)[1] - r}
                                    width={r * 2}
                                    height={r * 2}
                                    stroke={pointIdx == 0? "red": "#00aa00"}
                                    strokeWidth={2}
                                />
                            );
                        })}
                        {texts}
                    </React.Fragment>
                )
            }) : null}
        </Group>
    );
}
