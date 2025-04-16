import React from "react";
import {Box, FormControl, MenuItem, Select, Stack} from "@mui/material";
import {Layer, Line, Stage} from 'react-konva';
import Grid from '@mui/material/Grid2';
import {brown, teal} from "@mui/material/colors";

import {Layout} from "@/app/jamo_layouts";
import UseDimensions from "@/app/useDimensions";
import {Point} from "@/app/parse_glyph";
import {OS2} from "@/app/TTXObject";
import {getJamos} from "@/app/jamos";
import {LayoutControl} from "@/app/LayoutControl";


export function LayoutView(
    {
        layout,
        setLayout,
        allLayouts,
        os2,
        showPoints,
    }: Readonly<{
        layout: Layout;
        setLayout: (layout: Layout) => void;
        allLayouts: Layout[];
        os2: OS2;
        showPoints: boolean;
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

    const jamoLists = layout.elems.values()
        .map((kind) => getJamos(kind))
        .toArray();

    const [curJamos, setCurOtherJamos] = React.useState(
        jamoLists.map((jamos) => jamos[0])
    );

    const outlineColor = teal[500];

    return (
        <Stack>
            <Stack ref={ref}>
                <Stage width={width} height={width} >
                    <Layer>
                        {[true, false].map((drawBackground, key) => (
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
                                rescale={rescale}
                                xyScales={{x: scale, y: -scale}}
                                layout={layout}
                                setLayout={setLayout}
                                allLayouts={allLayouts}
                                curJamos={curJamos}
                                topLevel={true}
                                drawBackground={drawBackground}
                                showPoints={showPoints}
                            />
                        ))}
                    </Layer>

                    {/* Draw guides */}
                    <Layer>
                        <Line
                            points={[
                                ...rescale({ x: 0, y: -Infinity }),
                                ...rescale({ x: 0, y: Infinity }),
                            ]}
                            stroke={outlineColor}
                            strokeWidth={1}
                        />
                        <Line
                            points={[
                                ...rescale({ x: 1000, y: -Infinity }),
                                ...rescale({ x: 1000, y: Infinity }),
                            ]}
                            stroke={outlineColor}
                            strokeWidth={1}
                        />
                        <Line
                            points={[
                                ...rescale({ x: -Infinity, y: 0 }),
                                ...rescale({ x: Infinity, y: 0 }),
                            ]}
                            stroke={brown[500]}
                            strokeWidth={1}
                        />
                        <Line
                            points={[
                                ...rescale({ x: -Infinity, y: ascender }),
                                ...rescale({ x: Infinity, y: ascender }),
                            ]}
                            stroke={outlineColor}
                            strokeWidth={1}
                        />
                        <Line
                            points={[
                                ...rescale({ x: -Infinity, y: descender }),
                                ...rescale({ x: Infinity, y: descender }),
                            ]}
                            stroke={outlineColor}
                            strokeWidth={1}
                        />
                    </Layer>
                </Stage>
            </Stack>
            <Grid container spacing={1} alignItems="center">
                <Grid size={5}>
                    <Box>{layout.name}</Box>
                </Grid>
                <Grid size={7}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {curJamos.map((jamo, i) =>
                            <FormControl
                                key={i}
                                variant="standard"
                                size="small">
                                <Select
                                    variant={i === 0? "outlined" : "outlined"}
                                    labelId="jamo-select-label"
                                    id="jamo-select"
                                    value={jamo}
                                    onChange={(e) => {
                                        const newCurOtherJamos = [...curJamos];
                                        newCurOtherJamos[i] = e.target.value as string;
                                        setCurOtherJamos(newCurOtherJamos);
                                    }}
                                    label="Jamo">
                                    {jamoLists[i].map((jamo, j) => (
                                        <MenuItem key={j} value={jamo}>{jamo}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    );
}
