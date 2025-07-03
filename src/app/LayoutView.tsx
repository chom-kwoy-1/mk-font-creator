import React from "react";
import {
    AppBar,
    Box, Button,
    Dialog, DialogActions,
    DialogContent, FormControl,
    IconButton,
    InputLabel,
    Menu,
    MenuItem,
    Select,
    Stack, Toolbar, Typography
} from "@mui/material";
import {Layer, Line, Stage} from 'react-konva';
import {brown, teal} from "@mui/material/colors";

import {Layout, Layouts} from "@/app/jamo_layouts";
import {Point} from "@/app/parse_glyph";
import {TTXWrapper} from "@/app/TTXObject";
import {getJamos, getLVT} from "@/app/jamos";
import {LayoutControl} from "@/app/LayoutControl";
import {Fullscreen, MoreVert} from "@mui/icons-material";
import {CloseIcon} from "next/dist/client/components/react-dev-overlay/internal/icons/CloseIcon";
import useDimensions from "@/app/useDimensions";


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

    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const menuOpen = Boolean(anchorEl);

    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);

    return (
        <Stack>
            <Stack direction={"row"} alignItems="center" justifyContent="space-between">
                <Box>{layout.name}</Box>
                <div>
                    <IconButton onClick={(e) => { setDialogOpen(true); }}>
                        <Fullscreen />
                    </IconButton>
                    <Dialog open={dialogOpen} maxWidth={'md'} fullWidth={true}>
                        <AppBar sx={{ position: 'relative' }}>
                            <Toolbar>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    onClick={(e) => { setDialogOpen(false); }}
                                    aria-label="close"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                                    Edit Glyph
                                </Typography>
                            </Toolbar>
                        </AppBar>
                        <DialogContent>
                            <EditGlyph
                                layout={layout}
                                setLayout={setLayout}
                                curAllJamos={curAllJamos}
                                allLayouts={allLayouts}
                                ttx={ttx}
                                showPoints={showPoints}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button autoFocus onClick={(e) => { setDialogOpen(false); }}>
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </Stack>
            <EditGlyph
                layout={layout}
                setLayout={setLayout}
                curAllJamos={curAllJamos}
                allLayouts={allLayouts}
                ttx={ttx}
                showPoints={showPoints}
            />
            <Stack direction="row" spacing={2} alignItems={"center"} justifyContent={"space-between"}>
                <Stack direction="row" spacing={1} alignItems={"center"}>
                    {curJamos.map((jamo, i) =>
                        <Box key={i}>
                            <FormControl size="small">
                                <InputLabel id="select">{getLVT(jamo)}</InputLabel>
                                <Select
                                    labelId="select"
                                    variant={i === 0 ? "outlined" : "outlined"}
                                    size={"small"}
                                    value={jamo}
                                    onChange={(e) => {
                                        const newCurJamos = [...curJamos];
                                        newCurJamos[i] = e.target.value as string;
                                        setCurJamos(newCurJamos);
                                    }}
                                >
                                    {jamoLists[i].map((jamo, j) => (
                                        <MenuItem key={j} value={jamo}>
                                            {jamo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </Stack>
                <div>
                    <IconButton onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                    }}>
                        <MoreVert/>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={menuOpen} onClose={() => {
                        setAnchorEl(null);
                    }}>
                        <MenuItem>abc</MenuItem>
                    </Menu>
                </div>
            </Stack>
        </Stack>
    );
}

function EditGlyph(
    {
        layout,
        setLayout,
        curAllJamos,
        allLayouts,
        ttx,
        showPoints,
        outlineColor = teal[500],
        baselineColor = brown[500],
    }: Readonly<{
        layout: Layout;
        setLayout: (layout: Layout) => void;
        curAllJamos: string[];
        allLayouts: Layouts;
        ttx: TTXWrapper;
        showPoints: boolean;
        outlineColor?: string;
        baselineColor?: string;
    }>
) {
    const os2 = ttx.getOS2();
    const ascender = parseInt(os2.sTypoAscender[0]['@_value']);
    const descender = parseInt(os2.sTypoDescender[0]['@_value']);

    const ref = React.useRef<HTMLDivElement | null>(null);
    const {width} = useDimensions(ref);

    const aspectRatio = 1.;
    const canvasWidth = width;
    const canvasHeight = aspectRatio * canvasWidth;

    const [left, setLeft] = React.useState<number>(-250);
    const [bottom, setBottom] = React.useState<number>(-400);
    const [viewWidth, setViewWidth] = React.useState<number>(1500);
    const [isHovering, setIsHovering] = React.useState<boolean>(false);

    const minCanvasSide = Math.min(canvasWidth, canvasHeight);
    const scale = minCanvasSide / viewWidth;

    function rescale(p: Point): number[] {
        let x = (p.x - left) * scale;
        x = x === -Infinity? 0 : (x === Infinity? canvasWidth : x);
        let y = canvasHeight - (p.y - bottom) * scale;
        y = y === -Infinity? 0 : (y === Infinity? canvasHeight : y);

        return [x, y];
    }

    return (
        <Stack ref={ref}>
            <Stage width={canvasWidth} height={canvasHeight}
                   onMouseEnter={(e) => { setIsHovering(true); }}
                   onMouseLeave={(e) => { setIsHovering(false); }}>
                <Layer name='background-layer'/>
                <Layer name='nonclick-layer'/>
                <Layer>
                    <LayoutControl
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
                        showPoints={showPoints}
                        isHovering={isHovering}
                    />
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
                        stroke={baselineColor}
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
    );
}