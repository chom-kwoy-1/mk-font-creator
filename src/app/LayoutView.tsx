import React from "react";
import {Box, FormControl, InputLabel, MenuItem, Select, Stack} from "@mui/material";
import Konva from "konva";
import {Group, Layer, Line, Rect, Stage} from 'react-konva';
import Grid from '@mui/material/Grid2';

import {Divider, JamoElement, JamoSubkind, Layout, ResizedGlyph} from "@/app/jamo_layouts";
import UseDimensions from "@/app/useDimensions";
import {Point} from "@/app/parse_glyph";
import {Charstring, Cmap4, FontDict, OS2} from "@/app/TTXObject";
import {getJamos, subkindOf} from "@/app/jamos";
import {Bounds} from "@/app/font_utils";
import {ResizeableRect} from "@/app/ResizeableRect";
import {ResizedGlyphView} from "@/app/ResizedGlyphView";


export function LayoutView(
    {
        layout,
        setLayout,
        otherLayouts,
        fdarray,
        charstrings,
        os2,
        cmap4
    }: Readonly<{
        layout: Layout;
        setLayout: (layout: Layout) => void;
        otherLayouts: Layout[];
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

    const [curJamo, setCurJamo] = React.useState(layout.glyphs.keys().next().value?? null);
    const [curOtherJamos, setCurOtherJamos] = React.useState(
        layout.elems.values()
            .filter((kind) => !kind.endsWith(layout.focus))
            .map((kind) => getJamos(kind)[0])
            .toArray()
    );

    const resizedGlyph = curJamo? layout.glyphs.get(curJamo) : null;

    const curOtherJamoSubkinds = curOtherJamos
        .map((jamo) => subkindOf.get(jamo) as JamoSubkind);
    const selectedOtherLayouts = new Map(curOtherJamos.map((otherJamo) => {
        const otherJamoSubkind = subkindOf.get(otherJamo) as JamoSubkind;
        let filteredOtherLayouts = otherLayouts
            .filter((layout_) => layout_.elems.values().some((elem) => elem === otherJamoSubkind))
            .filter((layout_) => layout_.elems.values().some((elem) => layout.focus.endsWith(elem)));
        for (const otherJamoSubkind_ of curOtherJamoSubkinds) {
            if (otherJamoSubkind_ !== otherJamoSubkind) {
                filteredOtherLayouts = filteredOtherLayouts
                    .filter((layout_) => layout_.elems.values().some((elem) => otherJamoSubkind_.endsWith(elem)));
            }
        }
        if (filteredOtherLayouts.length !== 1) {
            throw new Error(`Multiple layouts selected: ${filteredOtherLayouts}`);
        }
        return [
            otherJamoSubkind,
            {'jamo': otherJamo, 'layout': filteredOtherLayouts[0]},
        ];
    }));

    return (
        <Stack>
            <Stack ref={ref}>
                <Stage width={width} height={width}>
                    <Layer>
                        {resizedGlyph && [true, false].map((drawBackground, key) => (
                            <DrawDivider
                                key={key}
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
                                    if (curJamo) {
                                        const newGlyphs = new Map(layout.glyphs);
                                        newGlyphs.set(curJamo, resizedGlyph);
                                        setLayout({...layout, glyphs: newGlyphs});
                                    }
                                }}
                                otherLayouts={selectedOtherLayouts}
                                drawBackground={drawBackground}
                            />))}
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
                                value={curJamo}
                                onChange={(e) => {
                                    setCurJamo(e.target.value as string);
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

function DrawDivider(
    {
        divider, setDivider,
        left, right, top, bottom,
        ...props
    }: Readonly<{
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
        otherLayouts: Map<JamoSubkind, {jamo: string, layout: Layout}>,
        drawBackground: boolean,
    }>
) {
    const {
        focus,
        rescale,
        xyScales,
        resizedGlyph,
        setResizedGlyph,
        otherLayouts,
        drawBackground,
    } = props;

    if (divider.type === 'jamo') {
        if (focus === divider.kind) {
            if (resizedGlyph) {
                const resizedBounds = resizedGlyph.bounds;

                return (
                    <React.Fragment>
                        <DrawBounds
                            bounds={{left: left, right: right, top: top, bottom: bottom}}
                            rescale={rescale}
                            fill={drawBackground? "lightgrey" : "transparent"}
                        />

                        {!drawBackground &&
                            <React.Fragment>
                                <ResizedGlyphView
                                    resizedGlyph={resizedGlyph}
                                    rescale={rescale}
                                    bounds={{left: left, right: right, top: top, bottom: bottom}}
                                />

                                <ResizeableRect
                                    bounds={{
                                        left: left + resizedBounds.left * (right - left),
                                        right: left + resizedBounds.right * (right - left),
                                        top: bottom + resizedBounds.top * (top - bottom),
                                        bottom: bottom + resizedBounds.bottom * (top - bottom),
                                    }}
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
                            </React.Fragment>}
                    </React.Fragment>
                );
            }
        }
        else {
            if (!drawBackground) {
                const otherLayout = otherLayouts.get(
                    otherLayouts.keys().find(
                        (subkind) => subkind.endsWith(divider.kind)
                    ) as JamoSubkind
                );
                const resizedGlyph = otherLayout?.layout.glyphs.get(otherLayout.jamo);

                if (otherLayout && resizedGlyph) {
                    return (
                        <ResizedGlyphView
                            resizedGlyph={resizedGlyph}
                            rescale={rescale}
                            bounds={{left: left, right: right, top: top, bottom: bottom}}
                        />
                    );
                }
            }
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
                {!drawBackground &&
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
                    </Group>}
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
                {!drawBackground &&
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
                    </Group>}
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
