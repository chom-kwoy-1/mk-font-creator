import React from "react";
import {Box, FormControl, InputLabel, MenuItem, Select, Stack} from "@mui/material";
import {Layer, Line, Stage} from 'react-konva';
import Grid from '@mui/material/Grid2';

import {JamoSubkind, Layout} from "@/app/jamo_layouts";
import UseDimensions from "@/app/useDimensions";
import {Point} from "@/app/parse_glyph";
import {Charstring, Cmap4, FontDict, OS2} from "@/app/TTXObject";
import {getJamos, subkindOf} from "@/app/jamos";
import {LayoutControl} from "@/app/LayoutControl";


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
                            <LayoutControl
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
