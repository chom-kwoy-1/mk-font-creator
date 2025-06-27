import {Charstring, OS2, TTXWrapper} from "@/app/TTXObject";
import {Category, Layouts, ResizedGlyph} from "@/app/jamo_layouts";
import React from "react";
import Konva from "konva";
import {parseGlyph, Point} from "@/app/parse_glyph";
import {findCharstringByCodepoint, glyphActualBounds} from "@/app/font_utils";
import {Accordion, AccordionDetails, AccordionSummary, MenuItem, Paper, Select, Stack, Typography} from "@mui/material";
import {Layer, Line, Stage, Text} from "react-konva";
import {brown} from "@mui/material/colors";
import {ResizedGlyphView} from "@/app/ResizedGlyphView";
import {getJamos} from "@/app/jamos";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Grid from "@mui/material/Grid2";
import {LayoutView} from "@/app/LayoutView";

export function CompositionLayouts(
    {ttx, curLayouts, setCurLayouts}: Readonly<{
        ttx: TTXWrapper,
        curLayouts: Layouts,
        setCurLayouts: (layouts: Layouts) => void,
    }>
) {
    const [left, setLeft] = React.useState<number>(0);
    const [bottom, setBottom] = React.useState<number>(-200);
    const [viewWidth, setViewWidth] = React.useState<number>(1000);

    const ref = React.useRef<Konva.Text>(null);

    const debug = false;
    if (debug) {
        const fdarray = ttx.getFDArray();

        const aspectRatio = 1.;
        const canvasWidth = 1400;
        const canvasHeight = aspectRatio * canvasWidth;

        const minCanvasSide = Math.min(canvasWidth, canvasHeight);
        const scale = minCanvasSide / viewWidth;

        function rescale(p: Point): number[] {
            let x = (p.x - left) * scale;
            x = x === -Infinity ? 0 : (x === Infinity ? canvasWidth : x);
            let y = canvasHeight - (p.y - bottom) * scale;
            y = y === -Infinity ? 0 : (y === Infinity ? canvasHeight : y);

            return [x, y];
        }

        const cs = findCharstringByCodepoint(
            'ㅊ'.codePointAt(0) as number,
            ttx,
        ) as Charstring;
        const glyph: ResizedGlyph = {
            glyph: parseGlyph(cs, fdarray),
            bounds: {left: 0.2, right: 0.8, top: 0.8, bottom: 0.7},
        }
        const bounds = {left: 0, right: 1000, top: 800, bottom: -200};
        const actualBounds = glyphActualBounds(glyph.glyph);
        const resizedBounds = glyph.bounds;
        const targetBounds = {
            left: bounds.left + resizedBounds.left * (bounds.right - bounds.left),
            right: bounds.left + resizedBounds.right * (bounds.right - bounds.left),
            top: bounds.bottom + resizedBounds.top * (bounds.top - bounds.bottom),
            bottom: bounds.bottom + resizedBounds.bottom * (bounds.top - bounds.bottom),
        };

        const xScale = (targetBounds.right - targetBounds.left) / (actualBounds.right - actualBounds.left);
        const yScale = (targetBounds.top - targetBounds.bottom) / (actualBounds.top - actualBounds.bottom);
        return (
            <Paper>
                <Stage
                    width={canvasWidth}
                    height={canvasHeight}
                    onMouseMove={(e) => {
                        if (ref.current) {
                            const x = e.evt.offsetX / scale + left;
                            const y = (canvasHeight - e.evt.offsetY) / scale + bottom;
                            const rx = (x - targetBounds.left) / xScale + actualBounds.left;
                            const ry = (y - targetBounds.bottom) / yScale + actualBounds.bottom;
                            ref.current.position({x: e.evt.offsetX, y: e.evt.offsetY - 10});
                            ref.current.text(`${rx.toFixed(0)}, ${ry.toFixed(0)}`);
                        }
                    }}>
                    <Layer>
                        <Line
                            points={[
                                ...rescale({x: 0, y: -Infinity}),
                                ...rescale({x: 0, y: Infinity}),
                            ]}
                            stroke={"white"}
                            strokeWidth={1}
                        />
                        <Line
                            points={[
                                ...rescale({x: 1000, y: -Infinity}),
                                ...rescale({x: 1000, y: Infinity}),
                            ]}
                            stroke={"white"}
                            strokeWidth={1}
                        />
                        <Line
                            points={[
                                ...rescale({x: -Infinity, y: 0}),
                                ...rescale({x: Infinity, y: 0}),
                            ]}
                            stroke={brown[500]}
                            strokeWidth={1}
                        />
                        <Line
                            points={[
                                ...rescale({x: -Infinity, y: 800}),
                                ...rescale({x: Infinity, y: 800}),
                            ]}
                            stroke={"white"}
                            strokeWidth={1}
                        />
                        <Line
                            points={[
                                ...rescale({x: -Infinity, y: -200}),
                                ...rescale({x: Infinity, y: -200}),
                            ]}
                            stroke={"white"}
                            strokeWidth={1}
                        />
                        <ResizedGlyphView
                            resizedGlyph={glyph}
                            rescale={rescale}
                            bounds={bounds}
                            showPoints={true}
                            strokeWidth={1}
                            stroke="grey"
                        />
                        <Text
                            ref={ref}
                            x={10}
                            y={10}
                            text={"Test"}
                            fontSize={10}
                            fill="grey"
                        />
                    </Layer>
                </Stage>
            </Paper>
        );
    }

    return (
        <Paper variant="outlined" sx={{my: {xs: 2, md: 4}, p: {xs: 1, md: 3}}}>
            {curLayouts.map((category, cidx) =>
                <LayoutCategory
                    key={cidx}
                    category={category}
                    cidx={cidx}
                    curLayouts={curLayouts}
                    setCurLayouts={setCurLayouts}
                    ttx={ttx}
                />
            )}
        </Paper>
    );
}

function LayoutCategory(
    {category, cidx, curLayouts, setCurLayouts, ttx}: Readonly<{
        category: Category;
        cidx: number;
        curLayouts: Layouts;
        setCurLayouts: (layouts: Layouts) => void;
        ttx: TTXWrapper;
    }>
) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [expandedOnce, setExpandedOnce] = React.useState(false);

    const jamoList = getJamos(category.focus);
    const [curJamo, setCurJamo] = React.useState(jamoList[0]);

    return (
        <Accordion
            expanded={isExpanded}
            onChange={(e, expanded) => {
                setIsExpanded(expanded);
                setExpandedOnce(expanded || expandedOnce);
            }}
            slotProps={{transition: {unmountOnExit: true}}}
        >
            <AccordionSummary
                expandIcon={<ArrowDropDownIcon/>}
            >
                <Stack direction="row" alignItems="center" spacing={3}>
                    <Typography variant="h6">
                        {category.categoryName}
                    </Typography>
                    <Select variant="outlined" size="small"
                            value={curJamo}
                            onChange={(e) => {
                                setCurJamo(e.target.value as string);
                            }}
                            disabled={!isExpanded}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}>
                        {jamoList.map((jamo, idx) => (
                            <MenuItem key={idx} value={jamo}>{jamo}</MenuItem>
                        ))}
                    </Select>
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                {expandedOnce &&
                    <Grid container spacing={2}>
                        {category.layouts.map((layout, idx) =>
                            <Grid key={idx} size={3}>
                                <Paper variant="elevation">
                                    <LayoutView
                                        layout={layout}
                                        setLayout={(newLayout) => {
                                            const newCategory = {
                                                ...category,
                                                layouts: category.layouts.map(
                                                    (layout, li) => li === idx ? newLayout : layout
                                                )
                                            };
                                            const newLayouts = curLayouts.map(
                                                (category, ci) => ci === cidx ? newCategory : category
                                            );
                                            setCurLayouts(newLayouts);
                                        }}
                                        curFocusJamo={curJamo}
                                        allLayouts={curLayouts}
                                        ttx={ttx}
                                        showPoints={false}
                                    />
                                </Paper>
                            </Grid>
                        )}
                    </Grid>}
            </AccordionDetails>
        </Accordion>
    );
}
