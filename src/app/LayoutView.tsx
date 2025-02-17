import React from "react";
import {Box, FormControl, InputLabel, MenuItem, Select, Stack} from "@mui/material";
import Konva from "konva";
import {Stage, Layer, Rect, Line, Group} from 'react-konva';
import Grid from '@mui/material/Grid2';

import {Layout, Divider, JamoElement, ResizedGlyph} from "@/app/jamo_layouts";
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
import {Bounds, findCharstringByCodepoint, glyphActualBounds} from "@/app/font_utils";


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

    const minCanvasSide = Math.min(canvasWidth, canvasHeight);
    const scale = minCanvasSide / viewWidth;

    function rescale(p: Point): number[] {
        let x = (p.x - left) * scale;
        x = x === -Infinity? 0 : (x === Infinity? canvasWidth : x);
        let y = canvasHeight - (p.y - bottom) * scale;
        y = y === -Infinity? 0 : (y === Infinity? canvasHeight : y);

        return [x, y];
    }
    function inverseRescale(p: Point): number[] {
        let x = p.x / scale + left;
        let y = p.y / scale + bottom;
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

    const [curGlyph, setCurGlyph] = React.useState(layout.glyphs.keys().next().value?? null);

    const resizedGlyph = curGlyph? layout.glyphs.get(curGlyph) : null;

    return (
        <Stack>
            <Stack ref={ref}>
                <Stage width={width} height={width}>
                    {resizedGlyph &&
                        <Layer>
                            <DrawDivider
                                divider={layout.dividers}
                                setDivider={(divider) => {
                                    setLayout({...layout, dividers: divider as Divider});
                                }}
                                left={0}
                                right={1000}
                                top={ascender}
                                bottom={descender}
                                focus={layout.focus}
                                rescale={rescale}
                                resizedGlyph={resizedGlyph}
                            />
                        </Layer>}

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
            <Grid container spacing={1} alignItems="center">
                <Grid size={6}>
                    <Box>{layout.name}</Box>
                </Grid>
                <Grid size={6}>
                    <Stack>
                        <FormControl variant="standard" sx={{ minWidth: 120 }} size="small">
                            <InputLabel id="jamo-select-label">Jamo</InputLabel>
                            <Select
                                variant="filled"
                                labelId="jamo-select-label"
                                id="jamo-select"
                                value={curGlyph}
                                onChange={(e) => {
                                    setCurGlyph(e.target.value as string);
                                }}
                                label="Jamo"
                            >
                                {layout.glyphs.keys().map((jamo, i) => (
                                    <MenuItem key={i} value={jamo}>{jamo}</MenuItem>
                                )).toArray()}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    );
}

export function DrawBounds(
    {bounds, rescale, ...props}: Readonly<{
        bounds: Bounds,
        rescale: (p: Point) => number[],
    } & Konva.RectConfig>)
{
    const bottomLeft = rescale({x: bounds.left, y: bounds.bottom});
    const topRight = rescale({x: bounds.right, y: bounds.top});
    return (
        <Rect
            x={bottomLeft[0]}
            y={bottomLeft[1]}
            width={(topRight[0] - bottomLeft[0])}
            height={(topRight[1] - bottomLeft[1])}
            {...props}
        />
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
    { divider, setDivider, left, right, top, bottom, ...props }: Readonly<{
        divider: JamoElement | Divider,
        setDivider: (divider: JamoElement | Divider) => void,
        left: number,
        right: number,
        top: number,
        bottom: number,
        focus: string,
        rescale: (p: Point) => number[],
        resizedGlyph: ResizedGlyph | null,
    }>
) {
    const { focus, rescale, resizedGlyph } = props;

    if (divider.type === 'jamo') {
        let glyphDOM = null;
        if (focus === divider.kind && resizedGlyph) {
            const actualBounds = glyphActualBounds(resizedGlyph.glyph);
            const resizedBounds = resizedGlyph.bounds;
            const targetBounds = {
                left: left + resizedBounds.left * (right - left),
                right: left + resizedBounds.right * (right - left),
                top: bottom + resizedBounds.top * (top - bottom),
                bottom: bottom + resizedBounds.bottom * (top - bottom),
            }

            function glyphRescale(p: Point): number[] {
                const x = (p.x - actualBounds.left) / (actualBounds.right - actualBounds.left);
                const y = (p.y - actualBounds.bottom) / (actualBounds.top - actualBounds.bottom);
                const x2 = targetBounds.left + x * (targetBounds.right - targetBounds.left);
                const y2 = targetBounds.bottom + y * (targetBounds.top - targetBounds.bottom);
                return rescale({x: x2, y: y2});
            }

            glyphDOM = (
                <React.Fragment>
                    <GlyphView
                        glyph={resizedGlyph.glyph}
                        rescale={glyphRescale}
                    />

                    <DrawBounds
                        bounds={targetBounds}
                        rescale={rescale}
                        stroke="red"
                        strokeWidth={1}
                    />
                </React.Fragment>
            );
        }

        return (
            <React.Fragment>
                <DrawBounds
                    bounds={{left: left, right: right, top: top, bottom: bottom}}
                    rescale={rescale}
                    fill={focus === divider.kind? "lightgrey" : undefined}
                />
                {glyphDOM}
            </React.Fragment>
        );
    }

    const [isDragging, setIsDragging] = React.useState<boolean>(false);
    const [position, setPosition] = React.useState<Point>({x: 0, y: 0});

    if (divider.type === 'vertical') {
        const x = left + divider.x * 1000;
        return (
            <React.Fragment>
                <DrawDivider
                    divider={divider.left}
                    setDivider={(newLeft) => {
                        setDivider({...divider, left: newLeft});
                    }}
                    left={left}
                    right={x}
                    top={top}
                    bottom={bottom}
                    {...props}
                />
                <DrawDivider
                    divider={divider.right}
                    setDivider={(newRight) => {
                        setDivider({...divider, right: newRight});
                    }}
                    left={x}
                    right={right}
                    top={top}
                    bottom={bottom}
                    {...props}
                />
                <Group
                    draggable={true}
                    onDragStart={(e) => {
                        setIsDragging(true);
                    }}
                    onDragMove={(e) => {
                        e.target.setPosition({x: e.target.x(), y: 0});
                    }}
                    onDragEnd={(e) => {
                        setIsDragging(false);
                        e.target.setPosition({x: 0, y: 0});
                    }}>
                    <Line
                        points={[
                            ...rescale({x: x, y: top}),
                            ...rescale({x: x, y: bottom}),
                        ]}
                        stroke="green"
                        hitStrokeWidth={10}
                    />
                </Group>
            </React.Fragment>
        );
    }
    else if (divider.type === 'horizontal') {
        const y = bottom + divider.y * 1000;
        return (
            <React.Fragment>
                <DrawDivider
                    divider={divider.top}
                    setDivider={(newTop) => {
                        setDivider({...divider, top: newTop});
                    }}
                    left={left}
                    right={right}
                    top={top}
                    bottom={y}
                    {...props}
                />
                <DrawDivider
                    divider={divider.bottom}
                    setDivider={(newBottom) => {
                        setDivider({...divider, bottom: newBottom});
                    }}
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
                    setDivider={(newTopLeft) => {
                        setDivider({...divider, topLeft: newTopLeft});
                    }}
                    left={left}
                    right={x}
                    top={top}
                    bottom={y}
                    {...props}
                />
                {/* TODO: add rest */}
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
