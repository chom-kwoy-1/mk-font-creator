import {Bounds} from "@/app/font_utils";
import {Point} from "@/app/parse_glyph";
import Konva from "konva";
import React from "react";
import {Group, Line, Rect} from "react-konva";
import {blue, amber} from "@mui/material/colors";

export function ResizeableRect(
    {
        bounds, setBounds,
        rescale,
        xyScales,
        children,
        ...props
    }: Readonly<{
        bounds: Bounds,
        setBounds: (bounds: Bounds) => void,
        rescale: (p: Point) => number[],
        xyScales: { x: number, y: number },
        children?: React.ReactNode,
    } & Konva.LineConfig>
) {
    const [isDragging, setIsDragging] = React.useState({
        bottom: false,
        right: false,
        top: false,
        left: false,
        whole: false,
    });
    const [isHovering, setIsHovering] = React.useState(false);
    const bottomRef = React.useRef<Konva.Line>(null);
    const rightRef = React.useRef<Konva.Line>(null);
    const topRef = React.useRef<Konva.Line>(null);
    const leftRef = React.useRef<Konva.Line>(null);
    const groupRef = React.useRef<Konva.Group>(null);
    const childRef = React.useRef<Konva.Group>(null);

    const updateNext = React.useRef(() => {});
    React.useLayoutEffect(() => {
        if (updateNext.current) {
            updateNext.current();
            updateNext.current = () => {};
        }
    });

    const [x1, y1] = rescale({x: bounds.left, y: bounds.bottom});
    const [x2, y2] = rescale({x: bounds.right, y: bounds.top});

    props = structuredClone(props);
    if (isHovering) {
        props.stroke = blue[500];
        props.strokeWidth = 3;
    }

    const dragColor = props.stroke;
    const handleSize = 7;
    const handleColor = amber[500];

    function updateRect(coords: {x1?: number, y1?: number, x2?: number, y2?: number}) {
        const newX1 = coords.x1 ?? x1;
        const newY1 = coords.y1 ?? y1;
        const newX2 = coords.x2 ?? x2;
        const newY2 = coords.y2 ?? y2;
        topRef.current?.points([newX2, newY2, newX1, newY2]);
        bottomRef.current?.points([newX1, newY1, newX2, newY1]);
        rightRef.current?.points([newX2, newY1, newX2, newY2]);
        leftRef.current?.points([newX1, newY2, newX1, newY1]);

        const scaleX = (newX2 - newX1) / (x2 - x1);
        const scaleY = (newY2 - newY1) / (y2 - y1);
        childRef.current?.x(-x1 * scaleX + newX1);
        childRef.current?.y(-y1 * scaleY + newY1);
        childRef.current?.scaleX(scaleX);
        childRef.current?.scaleY(scaleY);
    }

    return (
        <Group>
            <Group ref={childRef}>
                {children}
            </Group>

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
                    childRef.current?.x(rx);
                    childRef.current?.y(ry);
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
                        childRef.current?.x(0);
                        childRef.current?.y(0);
                        childRef.current?.scaleX(1);
                        childRef.current?.scaleY(1);
                    };
                }}
                onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                        container.style.cursor = "move";
                    }
                    setIsHovering(true);
                }}
                onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                        container.style.cursor = "default";
                    }
                    setIsHovering(false);
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
                <ResizeHandle
                    x={(x1 + x2) / 2}
                    y={y1}
                    handleSize={handleSize}
                    handleColor={handleColor}
                    resizeCursor={"ns-resize"}
                    isDragging={isDragging.bottom}
                    setIsDragging={(dragging) => setIsDragging({...isDragging, bottom: dragging})}
                    onDragMove={(x, y) => {
                        updateRect({y1: y1 + y});
                        return {x: 0, y: y};
                    }}
                    onDragEnd={(x, y, reset) => {
                        const offsetY = y / xyScales.y;
                        setBounds({
                            ...bounds,
                            bottom: bounds.bottom + offsetY,
                        });
                        updateNext.current = () => {
                            childRef.current?.x(0);
                            childRef.current?.y(0);
                            childRef.current?.scaleX(1);
                            childRef.current?.scaleY(1);
                            reset();
                        };
                    }}
                />
                <Line
                    ref={rightRef}
                    points={[x2, y1, x2, y2]}
                    {...props}
                    stroke={isDragging.right ? dragColor : props.stroke}
                    strokeWidth={isDragging.right ? 5 : (props.strokeWidth ?? 2)}
                />
                <ResizeHandle
                    x={x2}
                    y={(y1 + y2) / 2}
                    handleSize={handleSize}
                    handleColor={handleColor}
                    resizeCursor={"ew-resize"}
                    isDragging={isDragging.right}
                    setIsDragging={(dragging) => setIsDragging({...isDragging, right: dragging})}
                    onDragMove={(x, y) => {
                        updateRect({x2: x2 + x});
                        return {x: x, y: 0};
                    }}
                    onDragEnd={(x, y, reset) => {
                        const offsetX = x / xyScales.x;
                        setBounds({
                            ...bounds,
                            right: bounds.right + offsetX,
                        });
                        updateNext.current = () => {
                            childRef.current?.x(0);
                            childRef.current?.y(0);
                            childRef.current?.scaleX(1);
                            childRef.current?.scaleY(1);
                            reset();
                        };
                    }}
                />
                <Line
                    ref={topRef}
                    points={[x2, y2, x1, y2]}
                    {...props}
                    stroke={isDragging.top ? dragColor : props.stroke}
                    strokeWidth={isDragging.top ? 5 : (props.strokeWidth ?? 2)}
                />
                <ResizeHandle
                    x={(x1 + x2) / 2}
                    y={y2}
                    handleSize={handleSize}
                    handleColor={handleColor}
                    resizeCursor={"ns-resize"}
                    isDragging={isDragging.top}
                    setIsDragging={(dragging) => setIsDragging({...isDragging, top: dragging})}
                    onDragMove={(x, y) => {
                        updateRect({y2: y2 + y});
                        return {x: 0, y: y};
                    }}
                    onDragEnd={(x, y, reset) => {
                        const offsetY = y / xyScales.y;
                        setBounds({
                            ...bounds,
                            top: bounds.top + offsetY,
                        });
                        updateNext.current = () => {
                            childRef.current?.x(0);
                            childRef.current?.y(0);
                            childRef.current?.scaleX(1);
                            childRef.current?.scaleY(1);
                            reset();
                        };
                    }}
                />
                <Line
                    ref={leftRef}
                    points={[x1, y2, x1, y1]}
                    {...props}
                    stroke={isDragging.left ? dragColor : props.stroke}
                    strokeWidth={isDragging.left ? 5 : (props.strokeWidth ?? 2)}
                />
                <ResizeHandle
                    x={x1}
                    y={(y1 + y2) / 2}
                    handleSize={handleSize}
                    handleColor={handleColor}
                    resizeCursor={"ew-resize"}
                    isDragging={isDragging.left}
                    setIsDragging={(dragging) => setIsDragging({...isDragging, left: dragging})}
                    onDragMove={(x, y) => {
                        updateRect({x1: x1 + x});
                        return {x: x, y: 0};
                    }}
                    onDragEnd={(x, y, reset) => {
                        const offsetX = x / xyScales.x;
                        setBounds({
                            ...bounds,
                            left: bounds.left + offsetX,
                        });
                        updateNext.current = () => {
                            childRef.current?.x(0);
                            childRef.current?.y(0);
                            childRef.current?.scaleX(1);
                            childRef.current?.scaleY(1);
                            reset();
                        };
                    }}
                />
            </Group>
        </Group>
    );
}

function ResizeHandle(
    {
        x, y,
        handleSize,
        handleColor,
        resizeCursor,
        isDragging, setIsDragging,
        onDragMove, onDragEnd,
    }: Readonly<{
        x: number,
        y: number,
        handleSize: number,
        handleColor: string,
        resizeCursor: string,
        isDragging: boolean,
        setIsDragging: (isDragging: boolean) => void,
        onDragMove: (x: number, y: number) => {x: number, y: number},
        onDragEnd: (x: number, y: number, reset: () => void) => void,
    }>
) {

    return (
        <Rect
            x={0}
            y={0}
            offsetX={-x + handleSize / 2}
            offsetY={-y + handleSize / 2}
            width={handleSize}
            height={handleSize}
            stroke={handleColor}
            draggable={true}
            onDragStart={(e) => {
                setIsDragging(true);
            }}
            onDragMove={(e) => {
                e.target.setPosition(onDragMove(e.target.x(), e.target.y()));
            }}
            onDragEnd={(e) => {
                setIsDragging(false);
                onDragEnd(e.target.x(), e.target.y(), () => {e.target.setPosition({x: 0, y: 0});});
            }}
            onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
                const container = e.target.getStage()?.container();
                if (container) {
                    container.style.cursor = resizeCursor;
                }
            }}
            onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
                const container = e.target.getStage()?.container();
                if (container) {
                    container.style.cursor = "default";
                }
            }}
        />
    );
}
