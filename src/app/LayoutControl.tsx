import {Divider, JamoElement, JamoSubkind, Layout, ResizedGlyph} from "@/app/jamo_layouts";
import {Point} from "@/app/parse_glyph";
import React from "react";
import {ResizedGlyphView} from "@/app/ResizedGlyphView";
import {ResizeableRect} from "@/app/ResizeableRect";
import {Group, Line, Rect} from "react-konva";
import {Bounds} from "@/app/font_utils";
import Konva from "konva";

export function LayoutControl(
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
        xyScales: { x: number, y: number },
        resizedGlyph: ResizedGlyph | null,
        setResizedGlyph: (resizedGlyph: ResizedGlyph) => void,
        otherLayouts: Map<JamoSubkind, { jamo: string, layout: Layout }>,
        drawBackground: boolean,
        showPoints?: boolean,
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
        showPoints,
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
                            fill={drawBackground ? "lightgrey" : "transparent"}
                        />

                        {!drawBackground &&
                            <React.Fragment>
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

                                <ResizedGlyphView
                                    resizedGlyph={resizedGlyph}
                                    rescale={rescale}
                                    bounds={{left: left, right: right, top: top, bottom: bottom}}
                                    showPoints={showPoints}
                                    stroke="black"
                                />
                            </React.Fragment>}
                    </React.Fragment>
                );
            }
        } else {
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
                            showPoints={showPoints}
                            stroke="black"
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
                <LayoutControl
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
                <LayoutControl
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
                            stroke={isDragging ? "red" : "green"}
                            strokeWidth={isDragging ? 5 : 2}
                            hitStrokeWidth={10}
                        />
                    </Group>}
            </React.Fragment>
        );
    } else if (divider.type === 'horizontal') {
        const y = bottom + divider.y * (top - bottom);
        return (
            <React.Fragment>
                <LayoutControl
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
                <LayoutControl
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
                            stroke={isDragging ? "red" : "green"}
                            strokeWidth={isDragging ? 5 : 2}
                            hitStrokeWidth={10}
                        />
                    </Group>}
            </React.Fragment>
        );
    } else if (divider.type === 'mixed') {
        const x = left + divider.x * (right - left);
        const y = bottom + divider.y * (top - bottom);
        return (
            <React.Fragment>
                <LayoutControl
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
                ]} stroke="green"/>
            </React.Fragment>
        );
    } else {
        throw new Error(`Unknown divider type: ${divider}`);
    }
}

function DrawBounds(
    {bounds, rescale, ...props}: Readonly<{
        bounds: Bounds,
        rescale: (p: Point) => number[],
    } & Konva.RectConfig>) {
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