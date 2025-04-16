import {Bounds} from "@/app/font_utils";
import {Point} from "@/app/parse_glyph";
import Konva from "konva";
import React from "react";
import {Group, Line, Rect} from "react-konva";

export function ResizeableRect(
    {bounds, setBounds, rescale, xyScales, resizedRefs, ...props}: Readonly<{
        bounds: Bounds,
        setBounds: (bounds: Bounds) => void,
        rescale: (p: Point) => number[],
        xyScales: { x: number, y: number },
        resizedRefs: Konva.Group[],
    } & Konva.LineConfig>) {
    const [isDragging, setIsDragging] = React.useState({
        bottom: false,
        right: false,
        top: false,
        left: false,
        whole: false,
    });
    const bottomRef = React.useRef<Konva.Line>(null);
    const rightRef = React.useRef<Konva.Line>(null);
    const topRef = React.useRef<Konva.Line>(null);
    const leftRef = React.useRef<Konva.Line>(null);
    const groupRef = React.useRef<Konva.Group>(null);

    const updateNext = React.useRef(() => {});
    React.useEffect(() => {
        if (updateNext.current) {
            updateNext.current();
            updateNext.current = () => {};
        }
    });

    const [x1, y1] = rescale({x: bounds.left, y: bounds.bottom});
    const [x2, y2] = rescale({x: bounds.right, y: bounds.top});

    const dragColor = props.stroke;

    const horzLineProps: Konva.LineConfig = {
        onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => {
            const container = e.target.getStage()?.container();
            if (container) {
                container.style.cursor = "ns-resize";
            }
        },
        onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => {
            const container = e.target.getStage()?.container();
            if (container) {
                container.style.cursor = "default";
            }
        },
    };
    const vertLineProps: Konva.LineConfig = {
        onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => {
            const container = e.target.getStage()?.container();
            if (container) {
                container.style.cursor = "ew-resize";
            }
        },
        onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => {
            const container = e.target.getStage()?.container();
            if (container) {
                container.style.cursor = "default";
            }
        },
    };

    const handleSize = 7;
    const handleColor = '#a7a7ff';

    return (
        <Group>
            <Rect
                x={0}
                y={0}
                offsetX={-x1}
                offsetY={-y1}
                width={(x2 - x1)}
                height={(y2 - y1)}
                draggable={true}
                onDragStart={(e) => {
                    setIsDragging({...isDragging, whole: true});
                }}
                onDragMove={(e) => {
                    const rx = e.target.x();
                    const ry = e.target.y();
                    groupRef.current?.offset({x: -rx, y: -ry});
                    // bottomRef.current?.points([x1 + rx, y1 + ry, x2 + rx, y1 + ry]);
                    // rightRef.current?.points([x2 + rx, y1 + ry, x2 + rx, y2 + ry]);
                    // topRef.current?.points([x2 + rx, y2 + ry, x1 + rx, y2 + ry]);
                    // leftRef.current?.points([x1 + rx, y2 + ry, x1 + rx, y1 + ry]);
                    for (const ref of resizedRefs) {
                        ref.x(rx);
                        ref.y(ry);
                    }
                }}
                onDragEnd={(e) => {
                    setIsDragging({...isDragging, whole: false});
                    const offsetX = e.target.x() / xyScales.x;
                    const offsetY = e.target.y() / xyScales.y;
                    setBounds({
                        left: bounds.left + offsetX,
                        right: bounds.right + offsetX,
                        top: bounds.top + offsetY,
                        bottom: bounds.bottom + offsetY,
                    });
                    updateNext.current = () => {
                        groupRef.current?.offset({x: 0, y: 0});
                        e.target.setPosition({x: 0, y: 0});
                        for (const ref of resizedRefs) {
                            ref.x(0);
                            ref.y(0);
                        }
                    };
                }}
                onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                        container.style.cursor = "move";
                    }
                }}
                onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                        container.style.cursor = "default";
                    }
                }}
            />

            <Group ref={groupRef}>
                <Line
                    ref={bottomRef}
                    points={[x1, y1, x2, y1]}
                    {...props}
                    stroke={isDragging.bottom ? dragColor : props.stroke}
                    strokeWidth={isDragging.bottom ? 5 : (props.strokeWidth ?? 2)}
                />
                <Rect
                    x={0}
                    y={0}
                    offsetX={-(x1 + x2) / 2 + handleSize / 2}
                    offsetY={-y1 + handleSize / 2}
                    width={handleSize}
                    height={handleSize}
                    stroke={handleColor}
                    draggable={true}
                    onDragStart={(e) => {
                        setIsDragging({...isDragging, bottom: true});
                    }}
                    onDragMove={(e) => {
                        const newY1 = y1 + e.target.y();
                        bottomRef.current?.points([x1, newY1, x2, newY1]);
                        rightRef.current?.points([x2, newY1, x2, y2]);
                        leftRef.current?.points([x1, y2, x1, newY1]);
                        e.target.setPosition({x: 0, y: e.target.y()});
                    }}
                    onDragEnd={(e) => {
                        setIsDragging({...isDragging, bottom: false});
                        const offsetY = e.target.y() / xyScales.y;
                        setBounds({
                            ...bounds,
                            bottom: bounds.bottom + offsetY,
                        });
                        e.target.setPosition({x: 0, y: 0});
                    }}
                    {...horzLineProps}
                />
                <Line
                    ref={rightRef}
                    points={[x2, y1, x2, y2]}
                    {...props}
                    stroke={isDragging.right ? dragColor : props.stroke}
                    strokeWidth={isDragging.right ? 5 : (props.strokeWidth ?? 2)}
                />
                <Rect
                    x={0}
                    y={0}
                    offsetX={-x2 + handleSize / 2}
                    offsetY={-(y1 + y2) / 2 + handleSize / 2}
                    width={handleSize}
                    height={handleSize}
                    stroke={handleColor}
                    draggable={true}
                    onDragStart={(e) => {
                        setIsDragging({...isDragging, right: true});
                    }}
                    onDragMove={(e) => {
                        const newX2 = x2 + e.target.x();
                        rightRef.current?.points([newX2, y1, newX2, y2]);
                        bottomRef.current?.points([x1, y1, newX2, y1]);
                        topRef.current?.points([newX2, y2, x1, y2]);
                        e.target.setPosition({x: e.target.x(), y: 0});
                    }}
                    onDragEnd={(e) => {
                        setIsDragging({...isDragging, right: false});
                        const offsetX = e.target.x() / xyScales.x;
                        setBounds({
                            ...bounds,
                            right: bounds.right + offsetX,
                        });
                        e.target.setPosition({x: 0, y: 0});
                    }}
                    {...vertLineProps}
                />
                <Line
                    ref={topRef}
                    points={[x2, y2, x1, y2]}
                    {...props}
                    stroke={isDragging.top ? dragColor : props.stroke}
                    strokeWidth={isDragging.top ? 5 : (props.strokeWidth ?? 2)}
                />
                <Rect
                    x={0}
                    y={0}
                    offsetX={-(x1 + x2) / 2 + handleSize / 2}
                    offsetY={-y2 + handleSize / 2}
                    width={handleSize}
                    height={handleSize}
                    stroke={handleColor}
                    draggable={true}
                    onDragStart={(e) => {
                        setIsDragging({...isDragging, top: true});
                    }}
                    onDragMove={(e) => {
                        const newY2 = y2 + e.target.y();
                        topRef.current?.points([x2, newY2, x1, newY2]);
                        rightRef.current?.points([x2, y1, x2, newY2]);
                        leftRef.current?.points([x1, newY2, x1, y1]);
                        e.target.setPosition({x: 0, y: e.target.y()});
                    }}
                    onDragEnd={(e) => {
                        setIsDragging({...isDragging, top: false});
                        const offsetY = e.target.y() / xyScales.y;
                        setBounds({
                            ...bounds,
                            top: bounds.top + offsetY,
                        });
                        e.target.setPosition({x: 0, y: 0});
                    }}
                    {...horzLineProps}
                />
                <Line
                    ref={leftRef}
                    points={[x1, y2, x1, y1]}
                    {...props}
                    stroke={isDragging.left ? dragColor : props.stroke}
                    strokeWidth={isDragging.left ? 5 : (props.strokeWidth ?? 2)}
                />
                <Rect
                    x={0}
                    y={0}
                    offsetX={-x1 + handleSize / 2}
                    offsetY={-(y1 + y2) / 2 + handleSize / 2}
                    width={handleSize}
                    height={handleSize}
                    stroke={handleColor}
                    draggable={true}
                    onDragStart={(e) => {
                        setIsDragging({...isDragging, left: true});
                    }}
                    onDragMove={(e) => {
                        const newX1 = x1 + e.target.x();
                        leftRef.current?.points([newX1, y2, newX1, y1]);
                        bottomRef.current?.points([newX1, y1, x2, y1]);
                        topRef.current?.points([x2, y2, newX1, y2]);
                        e.target.setPosition({x: e.target.x(), y: 0});
                    }}
                    onDragEnd={(e) => {
                        setIsDragging({...isDragging, left: false});
                        const offsetX = e.target.x() / xyScales.x;
                        setBounds({
                            ...bounds,
                            left: bounds.left + offsetX,
                        });
                        e.target.setPosition({x: 0, y: 0});
                    }}
                    {...vertLineProps}
                />
            </Group>
        </Group>
    );
}