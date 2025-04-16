import React from "react";
import {Stack} from "@mui/material";
import { Stage, Layer, Rect, Line } from 'react-konva';

import {Layout, Divider, JamoElement} from "./jamo_layouts";
import UseDimensions from "./useDimensions";
import {Point} from "@/app/parse_glyph";
import {Charstring, FontDict, OS2} from "./TTXObject";
import {GlyphView} from "@/app/GlyphView";

export function LayoutView(
    {layout, fdarray, charstrings, os2}: Readonly<{
        layout: Layout;
        fdarray: FontDict[];
        charstrings: Charstring[];
        os2: OS2;
    }>
) {
    const ascender = parseInt(os2.sTypoAscender['@_value']);
    const descender = parseInt(os2.sTypoDescender['@_value']);

    const ref = React.useRef(null);
    const { width, } = UseDimensions(ref);

    const aspectRatio = 1.;
    const canvasWidth = width, canvasHeight = aspectRatio * width;

    const [left, setLeft] = React.useState<number>(-250);
    const [bottom, setBottom] = React.useState<number>(-400);
    const [viewWidth, setViewWidth] = React.useState<number>(1500);

    function rescale(p: Point): number[] {
        const minCanvasSide = Math.min(canvasWidth, canvasHeight);
        const scale = minCanvasSide / viewWidth;

        let x = (p.x - left) * scale;
        x = x === -Infinity? 0 : (x === Infinity? canvasWidth : x);
        let y = canvasHeight - (p.y - bottom) * scale;
        y = y === -Infinity? 0 : (y === Infinity? canvasHeight : y);

        return [x, y];
    }

    return (
        <Stack ref={ref}>
            <Stage width={width} height={width}>
                <Layer>
                    <DrawDivider
                        divider={layout.dividers}
                        left={0}
                        right={1000}
                        top={ascender}
                        bottom={descender}
                        focus={layout.focus}
                        rescale={rescale}
                    />
                </Layer>

                {/* Draw example glyph */}
                <GlyphView
                    charstring={charstrings[10386]}
                    fdarray={fdarray}
                    rescale={rescale}
                />

                {/* Draw guides */}
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
                            ...rescale({ x: 1000, y: -Infinity }),
                            ...rescale({ x: 1000, y: Infinity }),
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
        </Stack>
    );
}

function DrawDivider(
    { divider, left, right, top, bottom, ...props }: Readonly<{
        divider: JamoElement | Divider,
        left: number,
        right: number,
        top: number,
        bottom: number,
        focus: string,
        rescale: (p: Point) => number[],
    }>
) {
    const { focus, rescale } = props;

    if (divider.type === 'jamo') {
        const [x1, y1, x2, y2] = [
            ...rescale({x: left, y: top}),
            ...rescale({x: right, y: bottom}),
        ];
        return (
            <Rect
                x={x1}
                y={y1}
                width={x2 - x1}
                height={y2 - y1}
                fill={focus === divider.kind? "lightgrey" : undefined}
            />
        );
    }

    if (divider.type === 'vertical') {
        const x = left + divider.x * 1000;
        return (
            <React.Fragment>
                <DrawDivider
                    divider={divider.left}
                    left={left}
                    right={x}
                    top={top}
                    bottom={bottom}
                    {...props}
                />
                <DrawDivider
                    divider={divider.right}
                    left={x}
                    right={right}
                    top={top}
                    bottom={bottom}
                    {...props}
                />
                <Line points={[
                    ...rescale({x: x, y: top}),
                    ...rescale({x: x, y: bottom}),
                ]} stroke="black" />
            </React.Fragment>
        );
    }
    else if (divider.type === 'horizontal') {
        const y = bottom + divider.y * 1000;
        return (
            <React.Fragment>
                <DrawDivider
                    divider={divider.top}
                    left={left}
                    right={right}
                    top={top}
                    bottom={y}
                    {...props}
                />
                <DrawDivider
                    divider={divider.bottom}
                    left={left}
                    right={right}
                    top={y}
                    bottom={bottom}
                    {...props}
                />
                <Line points={[
                    ...rescale({x: left, y: y}),
                    ...rescale({x: right, y: y}),
                ]} stroke="black" />
            </React.Fragment>
        );
    }
    else if (divider.type === 'mixed') {
        const x = left + divider.x * 1000;
        const y = bottom + divider.y * 1000;
        return (
            <React.Fragment>
                <DrawDivider
                    divider={divider.topleft}
                    left={left}
                    right={x}
                    top={top}
                    bottom={y}
                    {...props}
                />
                <Line points={[
                    ...rescale({x: left, y: y}),
                    ...rescale({x: x, y: y}),
                    ...rescale({x: x, y: top}),
                ]} stroke="black" />
            </React.Fragment>
        );
    }
    else {
        throw new Error(`Unknown divider type: ${divider}`);
    }
}
