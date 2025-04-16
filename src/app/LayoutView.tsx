import React from "react";
import {Box, FormControl, InputLabel, MenuItem, Select, Stack} from "@mui/material";
import Konva from "konva";
import {Group, Layer, Line, Rect, Stage} from 'react-konva';
import Grid from '@mui/material/Grid2';

import {Divider, JamoElement, Layout, ResizedGlyph} from "@/app/jamo_layouts";
import UseDimensions from "@/app/useDimensions";
import {parseGlyph, Point} from "@/app/parse_glyph";
import {Charstring, Cmap4, FontDict, OS2} from "@/app/TTXObject";
import {GlyphView} from "@/app/GlyphView";
import {uniToPua} from "@/app/pua_uni_conv";
import {
    singleLeadingJamos,
    stackedLeadingJamos,
    doubleLeadingJamos,
    tripleLeadingJamos,
    singleRightVowelJamos,
    doubleRightVowelJamos,
    singleBottomVowelJamos,
    doubleBottomVowelJamos,
    singleMixedVowelJamos,
    doubleMixedVowelJamos,
    singleTailingJamos,
    stackedTailingJamos,
    doubleTailingJamos,
    tripleTailingJamos,
} from "@/app/jamos";
import {Bounds, findCharstringByCodepoint, glyphActualBounds} from "@/app/font_utils";
import {ResizeableRect} from "@/app/ResizeableRect";


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
                                setDivider={(newDivider) => {
                                    if (newDivider.type !== 'jamo') {
                                        setLayout({...layout, dividers: newDivider});
                                    }
                                }}
                                left={0}
                                right={1000}
                                top={ascender}
                                bottom={descender}
                                focus={layout.focus}
                                rescale={rescale}
                                xyScales={{x: scale, y: -scale}}
                                resizedGlyph={resizedGlyph}
                                setResizedGlyph={(resizedGlyph) => {
                                    if (curGlyph) {
                                        const newGlyphs = new Map(layout.glyphs);
                                        newGlyphs.set(curGlyph, resizedGlyph);
                                        setLayout({...layout, glyphs: newGlyphs});
                                    }
                                }}
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
            case 'leading':
                if (divider.subkind === 'single-leading') {
                    yield* singleLeadingJamos;
                }
                else if (divider.subkind === 'stacked-leading') {
                    yield* stackedLeadingJamos;
                }
                else if (divider.subkind === 'double-leading') {
                    yield* doubleLeadingJamos;
                }
                else if (divider.subkind === 'triple-leading') {
                    yield* tripleLeadingJamos;
                }
                else if (divider.subkind === undefined) {
                    yield* singleLeadingJamos;
                    yield* stackedLeadingJamos;
                    yield* doubleLeadingJamos;
                    yield* tripleLeadingJamos;
                }
                break;
            case 'right-vowel':
                if (divider.subkind === 'single-right-vowel') {
                    yield* singleRightVowelJamos;
                }
                else if (divider.subkind === 'double-right-vowel') {
                    yield* doubleRightVowelJamos;
                }
                else if (divider.subkind === undefined) {
                    yield* singleRightVowelJamos;
                    yield* doubleRightVowelJamos;
                }
                break;
            case 'bottom-vowel':
                if (divider.subkind === 'single-bottom-vowel') {
                    yield* singleBottomVowelJamos;
                }
                else if (divider.subkind === 'double-bottom-vowel') {
                    yield* doubleBottomVowelJamos;
                }
                else if (divider.subkind === undefined) {
                    yield* singleBottomVowelJamos;
                    yield* doubleBottomVowelJamos;
                }
                break;
            case 'mixed-vowel':
                if (divider.subkind === 'single-mixed-vowel') {
                    yield* singleMixedVowelJamos;
                }
                else if (divider.subkind === 'double-mixed-vowel') {
                    yield* doubleMixedVowelJamos;
                }
                else if (divider.subkind === undefined) {
                    yield* singleMixedVowelJamos;
                    yield* doubleMixedVowelJamos;
                }
                break;
            case 'tailing':
                if (divider.subkind === 'single-tailing') {
                    yield* singleTailingJamos;
                }
                else if (divider.subkind === 'stacked-tailing') {
                    yield* stackedTailingJamos;
                }
                else if (divider.subkind === 'double-tailing') {
                    yield* doubleTailingJamos;
                }
                else if (divider.subkind === 'triple-tailing') {
                    yield* tripleTailingJamos;
                }
                else if (divider.subkind === undefined) {
                    yield* singleTailingJamos;
                    yield* stackedTailingJamos;
                    yield* doubleTailingJamos;
                    yield* tripleTailingJamos;
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
        xyScales: {x: number, y: number},
        resizedGlyph: ResizedGlyph | null,
        setResizedGlyph: (resizedGlyph: ResizedGlyph) => void,
    }>
) {
    const { focus, rescale, xyScales, resizedGlyph, setResizedGlyph } = props;

    if (divider.type === 'jamo') {
        if (focus === divider.kind) {
            if (resizedGlyph) {
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

                return (
                    <React.Fragment>
                        <DrawBounds
                            bounds={{left: left, right: right, top: top, bottom: bottom}}
                            rescale={rescale}
                            fill="lightgrey"
                        />

                        <GlyphView
                            glyph={resizedGlyph.glyph}
                            rescale={glyphRescale}
                        />

                        <ResizeableRect
                            bounds={targetBounds}
                            setBounds={(newBounds) => {
                                setResizedGlyph({
                                    ...resizedGlyph,
                                    bounds: {
                                        left: (newBounds.left - left) / (right - left),
                                        right: (newBounds.right - left) / (right - left),
                                        top: (newBounds.top - bottom) / (top - bottom),
                                        bottom: (newBounds.bottom - bottom) / (top - bottom),
                                    },
                                });
                            }}
                            rescale={rescale}
                            xyScales={xyScales}
                            stroke="red"
                            strokeWidth={1}
                        />
                    </React.Fragment>
                );
            }
        }
        else {

        }

        return null;
    }

    const [isDragging, setIsDragging] = React.useState<boolean>(false);

    if (divider.type === 'vertical') {
        const x = left + divider.x * (right - left);
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
                        const offsetX = (e.target.x() / xyScales.x) / (right - left);
                        setDivider({
                            ...divider,
                            x: divider.x + offsetX,
                        });
                        e.target.setPosition({x: 0, y: 0});
                    }}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) {
                            container.style.cursor = "ew-resize";
                        }
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) {
                            container.style.cursor = "default";
                        }
                    }}>
                    <Line
                        points={[
                            ...rescale({x: x, y: top}),
                            ...rescale({x: x, y: bottom}),
                        ]}
                        stroke={isDragging? "red" : "green"}
                        strokeWidth={isDragging? 5 : 2}
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
                <Group
                    draggable={true}
                    onDragStart={(e) => {
                        setIsDragging(true);
                    }}
                    onDragMove={(e) => {
                        e.target.setPosition({x: 0, y: e.target.y()});
                    }}
                    onDragEnd={(e) => {
                        setIsDragging(false);
                        const offsetY = (e.target.y() / xyScales.y) / (top - bottom);
                        setDivider({
                            ...divider,
                            y: divider.y + offsetY,
                        });
                        e.target.setPosition({x: 0, y: 0});
                    }}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) {
                            container.style.cursor = "ns-resize";
                        }
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) {
                            container.style.cursor = "default";
                        }
                    }}>
                    <Line
                        points={[
                            ...rescale({x: left, y: y}),
                            ...rescale({x: right, y: y}),
                        ]}
                        stroke={isDragging? "red" : "green"}
                        strokeWidth={isDragging? 5 : 2}
                        hitStrokeWidth={10}
                    />
                </Group>
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
