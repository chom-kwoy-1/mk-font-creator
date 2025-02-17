import React from "react";
import {Stack} from "@mui/material";
import { Stage, Layer, Rect, Line } from 'react-konva';

import {Layout, Divider, JamoElement} from "@/app/jamo_layouts";
import UseDimensions from "@/app/useDimensions";
import {parseGlyph, Point} from "@/app/parse_glyph";
import {Charstring, Cmap4, FontDict, OS2} from "@/app/TTXObject";
import {GlyphView} from "@/app/GlyphView";
import {uniToPua} from "@/app/pua_uni_conv";
import {
    singleLeadingJamos,
    stackedLeadingJamos,
    rightVowelJamos,
    bottomVowelJamos,
    mixedVowelJamos,
} from "@/app/jamos";
import {findCharstringByCodepoint, glyphActualBounds} from "@/app/font_utils";


export function LayoutView(
    {
        layout,
        setLayout,
        fdarray,
        charstrings,
        os2,
        cmap4
    }: Readonly<{
        layout: Layout;
        setLayout: (layout: Layout) => void;
        fdarray: FontDict[];
        charstrings: Charstring[];
        os2: OS2;
        cmap4: Cmap4;
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

    if (false) {
        const exSyllGen = genExampleSyllables(layout.dividers);
        const exSyll = exSyllGen.find((syll) => {
            return uniToPua(syll).length === 1;
        });
        const codePoint = uniToPua(exSyll as string).codePointAt(0) as number;
        const cs = findCharstringByCodepoint(codePoint, cmap4, charstrings);
        const glyph = parseGlyph(cs, fdarray);
    }
    const glyph = layout.glyphs.values().next().value?.glyph;
    const actualBounds = glyph? glyphActualBounds(glyph) : null;

    function glyphRescale(p: Point): number[] {
        return rescale(p);
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
                <Layer>
                    {glyph &&
                        <GlyphView
                            glyph={glyph}
                            rescale={glyphRescale}
                        />}
                </Layer>

                <Layer>
                    {actualBounds &&
                        <Rect
                            x={glyphRescale({x: actualBounds.left, y: actualBounds.bottom})[0]}
                            y={glyphRescale({x: actualBounds.left, y: actualBounds.bottom})[1]}
                            width={(
                                glyphRescale({x: actualBounds.right, y: actualBounds.top})[0]
                                - glyphRescale({x: actualBounds.left, y: actualBounds.bottom})[0]
                            )}
                            height={(
                                glyphRescale({x: actualBounds.right, y: actualBounds.top})[1]
                                - glyphRescale({x: actualBounds.left, y: actualBounds.bottom})[1]
                            )}
                            stroke="red"
                            strokeWidth={1}
                        />}
                </Layer>

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

function* genExampleSyllables(divider: JamoElement | Divider): Generator<string> {
    if (divider.type === 'jamo') {
        switch (divider.kind) {
            case 'single-leading':
                for (const jamo of singleLeadingJamos) {
                    yield jamo;
                }
                break;
            case 'stacked-leading':
                for (const jamo of stackedLeadingJamos) {
                    yield jamo;
                }
                break;
            case 'right-vowel':
                for (const jamo of rightVowelJamos) {
                    yield jamo;
                }
                break;
            case 'bottom-vowel':
                for (const jamo of bottomVowelJamos) {
                    yield jamo;
                }
                break;
            case 'mixed-vowel':
                for (const jamo of mixedVowelJamos) {
                    yield jamo;
                }
                break;
        }
    }
    else if (divider.type === 'vertical') {
        for (const left of genExampleSyllables(divider.left)) {
            for (const right of genExampleSyllables(divider.right)) {
                yield left + right;
            }
        }
    }
    else if (divider.type === 'horizontal') {
        for (const top of genExampleSyllables(divider.top)) {
            for (const bottom of genExampleSyllables(divider.bottom)) {
                yield top + bottom;
            }
        }
    }
    else if (divider.type === 'mixed') {
        for (const topLeft of genExampleSyllables(divider.topLeft)) {
            for (const rest of genExampleSyllables(divider.rest)) {
                yield topLeft + rest;
            }
        }
    }
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
                ]} stroke="green" />
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
                ]} stroke="green" />
            </React.Fragment>
        );
    }
    else if (divider.type === 'mixed') {
        const x = left + divider.x * 1000;
        const y = bottom + divider.y * 1000;
        return (
            <React.Fragment>
                <DrawDivider
                    divider={divider.topLeft}
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
                ]} stroke="green" />
            </React.Fragment>
        );
    }
    else {
        throw new Error(`Unknown divider type: ${divider}`);
    }
}
