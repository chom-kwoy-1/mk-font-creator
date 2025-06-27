import React from "react";
import {Box, FormControl, IconButton, Menu, MenuItem, Select, Stack} from "@mui/material";
import {Layer, Line, Stage} from 'react-konva';
import Grid from '@mui/material/Grid2';
import {brown, teal} from "@mui/material/colors";

import {Layout, Layouts} from "@/app/jamo_layouts";
import UseDimensions from "@/app/useDimensions";
import {Point} from "@/app/parse_glyph";
import {OS2, TTXWrapper} from "@/app/TTXObject";
import {getJamos} from "@/app/jamos";
import {LayoutControl} from "@/app/LayoutControl";
import {Fullscreen, MoreVert} from "@mui/icons-material";


export function LayoutView(
    {
        layout,
        setLayout,
        curFocusJamo,
        allLayouts,
        ttx,
        showPoints,
    }: Readonly<{
        layout: Layout;
        setLayout: (layout: Layout) => void;
        curFocusJamo: string;
        allLayouts: Layouts;
        ttx: TTXWrapper;
        showPoints: boolean;
    }>
) {
    const os2 = ttx.getOS2();
    const ascender = parseInt(os2.sTypoAscender[0]['@_value']);
    const descender = parseInt(os2.sTypoDescender[0]['@_value']);

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
        .filter((kind) => !kind.endsWith(layout.focus))
        .map((kind) => getJamos(kind))
        .toArray();

    const [curJamos, setCurJamos] = React.useState(
        jamoLists.map((jamos) => jamos[0])
    );

    const curAllJamos = [...curJamos];
    const focusPos = layout.elems.values().toArray()
        .findIndex((kind) => kind.endsWith(layout.focus));
    curAllJamos.splice(focusPos, 0, curFocusJamo);

    const outlineColor = teal[500];

    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    return (
        <Stack>
            <Stack direction={"row"} alignItems="center" justifyContent="space-between">
                <Box>{layout.name}</Box>
                <IconButton>
                    <Fullscreen />
                </IconButton>
            </Stack>
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
                                curJamos={curAllJamos}
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
            <Stack direction="row" spacing={2} alignItems={"center"} justifyContent="space-between">
                {curJamos.map((jamo, i) =>
                    <Select
                        key={i}
                        variant={i === 0? "outlined" : "outlined"}
                        size={"small"}
                        value={jamo}
                        onChange={(e) => {
                            const newCurJamos = [...curJamos];
                            newCurJamos[i] = e.target.value as string;
                            setCurJamos(newCurJamos);
                        }}
                    >
                        {jamoLists[i].map((jamo, j) => (
                            <MenuItem key={j} value={jamo}>{jamo}</MenuItem>
                        ))}
                    </Select>
                )}
                <div>
                    <IconButton onClick={(e) => { setAnchorEl(e.currentTarget); }}>
                        <MoreVert />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={open} onClose={() => { setAnchorEl(null); }}>
                        <MenuItem>abc</MenuItem>
                    </Menu>
                </div>
            </Stack>
        </Stack>
    );
}
