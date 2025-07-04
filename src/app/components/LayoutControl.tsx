import {Divider, JamoElement, JamoSubkind, Layout, Layouts, ResizedGlyph} from "@/app/font_utils/jamo_layouts";
import {Point} from "@/app/font_utils/parse_glyph";
import React from "react";
import {Group, Line, Rect} from "react-konva";
import {grey} from "@mui/material/colors";
import {selectLayout, subkindOf} from "@/app/font_utils/jamos";
import {ResizeableJamo} from "@/app/components/ResizeableJamo";
import {Bounds} from "@/app/font_utils/font_utils";
import {Portal} from "react-konva-utils";

export function LayoutControl(
    {
        divider, setDivider,
        left, right, top, bottom,
        layout, setLayout, curJamos,
        topLevel,
        ...props
    }: Readonly<{
        divider: JamoElement | Divider,
        setDivider: (divider: JamoElement | Divider) => void,
        left: number,
        right: number,
        top: number,
        bottom: number,
        rescale: (p: Point) => number[],
        xyScales: { x: number, y: number },
        layout: Layout,
        setLayout: ((layout: Layout) => void) | null,
        allLayouts: Layouts,
        curJamos: string[],
        topLevel: boolean,
        showPoints?: boolean,
        isHovering: boolean,
    }>
) {
    const {
        rescale,
        xyScales,
        allLayouts,
        showPoints,
        isHovering,
    } = props;

    const [isDragging, setIsDragging] = React.useState<boolean>(false);

    const updateNext = React.useRef(() => {});
    React.useLayoutEffect(() => {
        if (updateNext.current) {
            updateNext.current();
            updateNext.current = () => {};
        }
    });

    const handleSize = 7;
    const dividerColor = grey[500];
    const handleColor = grey[500];

    const curFocus = layout.focus;

    function getGlyph(
        jamoElem: JamoElement | Divider,
        setDivider: (divider: JamoElement | Divider) => void,
        bounds: Bounds,
    ) {
        if (jamoElem.type === 'jamo') {
            const jamo = curJamos.find(
                (jamo) => subkindOf(jamo).values().some(
                    (subkind) => subkind.endsWith(jamoElem.kind)
                )
            );
            if (!jamo) {
                throw new Error(`No jamo found for ${jamoElem.kind}`);
            }

            let selectedLayout = selectLayout(
                allLayouts,
                jamo,
                curJamos.filter((otherJamo) => otherJamo !== jamo),
                layout.tag,
            );

            const isFocus = curFocus === jamoElem.kind;
            const resizedGlyph = selectedLayout.glyphs.get(jamo);

            if (!resizedGlyph) {
                throw new Error(`No resized glyph found for ${jamo}`);
            }

            const setResizedGlyph = (
                isFocus && setLayout ?
                    (newResizedGlyph: ResizedGlyph) => {
                        const newGlyphs = new Map(selectedLayout.glyphs);
                        newGlyphs.set(jamo, newResizedGlyph);
                        setLayout({...selectedLayout, glyphs: newGlyphs});
                    } : null
            );

            return (
                <Portal selector={".nonclick-layer"} enabled={!isFocus}>
                    <ResizeableJamo
                        left={bounds.left}
                        right={bounds.right}
                        top={bounds.top}
                        bottom={bounds.bottom}
                        rescale={rescale}
                        xyScales={xyScales}
                        isFocus={isFocus}
                        resizedGlyph={resizedGlyph}
                        setResizedGlyph={setResizedGlyph}
                        showPoints={showPoints}
                        isHovering={isHovering}
                    />
                </Portal>
            );
        }
        else {
            return (
                <LayoutControl
                    divider={jamoElem}
                    setDivider={setDivider}
                    left={bounds.left}
                    right={bounds.right}
                    top={bounds.top}
                    bottom={bounds.bottom}
                    layout={layout}
                    setLayout={setLayout}
                    curJamos={curJamos}
                    topLevel={false}
                    {...props}
                />
            );
        }
    }

    if (divider.type === 'vertical') {
        const x = left + divider.x * (right - left);

        const leftGlyph = getGlyph(
            divider.left,
            (newDivider) => { setDivider({...divider, left: newDivider}) },
            {left: left, right: x, top: top, bottom: bottom}
        );
        const rightGlyph = getGlyph(
            divider.right,
            (newDivider) => { setDivider({...divider, right: newDivider}) },
            {left: x, right: right, top: top, bottom: bottom}
        );

        const isFocus = (
            divider.left.type === 'jamo' && curFocus === divider.left.kind ||
            divider.right.type === 'jamo' && curFocus === divider.right.kind
        );

        return (
            <React.Fragment>
                {leftGlyph}
                {rightGlyph}
                {isFocus &&
                    <Portal selector={".background-layer"}>
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
                                updateNext.current = () => {
                                    e.target.setPosition({x: 0, y: 0});
                                };
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
                            <Rect
                                x={0}
                                y={0}
                                offsetX={-rescale({x: x, y: top})[0] + handleSize / 2}
                                offsetY={-rescale({x: x, y: top})[1] + handleSize}
                                width={handleSize}
                                height={handleSize}
                                stroke={handleColor}
                            />
                            <Line
                                points={[
                                    ...rescale({x: x, y: top}),
                                    ...rescale({x: x, y: bottom}),
                                ]}
                                stroke={dividerColor}
                                strokeWidth={isDragging ? 5 : 2}
                                hitStrokeWidth={0}
                            />
                        </Group>
                    </Portal>}
            </React.Fragment>
        );
    }
    else if (divider.type === 'horizontal') {
        const y = bottom + divider.y * (top - bottom);

        const topGlyph = getGlyph(
            divider.top,
            (newDivider) => { setDivider({...divider, top: newDivider}) },
            {left: left, right: right, top: top, bottom: y}
        );
        const bottomGlyph = getGlyph(
            divider.bottom,
            (newDivider) => { setDivider({...divider, bottom: newDivider}) },
            {left: left, right: right, top: y, bottom: bottom}
        );

        const isFocus = (
            divider.top.type === 'jamo' && curFocus === divider.top.kind ||
            divider.bottom.type === 'jamo' && curFocus === divider.bottom.kind
        );

        return (
            <React.Fragment>
                {topGlyph}
                {bottomGlyph}
                {isFocus &&
                    <Portal selector={".background-layer"}>
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
                                updateNext.current = () => {
                                    e.target.setPosition({x: 0, y: 0});
                                };
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
                            <Rect
                                x={0}
                                y={0}
                                offsetX={-rescale({x: left, y: y})[0] + handleSize}
                                offsetY={-rescale({x: left, y: y})[1] + handleSize / 2}
                                width={handleSize}
                                height={handleSize}
                                stroke={handleColor}
                            />
                            <Line
                                points={[
                                    ...rescale({x: left, y: y}),
                                    ...rescale({x: right, y: y}),
                                ]}
                                stroke={dividerColor}
                                strokeWidth={isDragging ? 5 : 2}
                                hitStrokeWidth={0}
                            />
                        </Group>
                    </Portal>}
            </React.Fragment>
        );
    } else if (divider.type === 'mixed') {
        const x = left + divider.x * (right - left);
        const y = bottom + divider.y * (top - bottom);

        const topLeftGlyph = getGlyph(
            divider.topLeft,
            (newDivider) => { setDivider({...divider, topLeft: newDivider}) },
            {left: left, right: x, top: top, bottom: y}
        );
        const restGlyph = getGlyph(
            divider.rest,
            (newDivider) => { setDivider({...divider, rest: newDivider}) },
            {left: left, right: right, top: top, bottom: bottom}
        );

        const isFocus = (
            divider.topLeft.type === 'jamo' && curFocus === divider.topLeft.kind ||
            divider.rest.type === 'jamo' && curFocus === divider.rest.kind
        );

        return (
            <React.Fragment>
                {topLeftGlyph}
                {restGlyph}
                {isFocus &&
                    <Portal selector={".background-layer"}>
                        <Line points={[
                            ...rescale({x: left, y: y}),
                            ...rescale({x: x, y: y}),
                            ...rescale({x: x, y: top}),
                        ]} stroke={dividerColor}/>
                    </Portal>}
            </React.Fragment>
        );
    } else {
        throw new Error(`Unknown divider type: ${divider.type}`);
    }
}
