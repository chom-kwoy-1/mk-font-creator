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
    interface IsDragging {
        [key: string]: boolean,
    }
    const [isDragging, setIsDragging] = React.useState<IsDragging>({
        bottom: false,
        right: false,
        top: false,
        left: false,
        bottomLeft: false,
        bottomRight: false,
        topLeft: false,
        topRight: false,
        whole: false,
    });
    const [isHovering, setIsHovering] = React.useState(false);

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

    interface LineRefs {
        [key: string]: Konva.Line | null,
    }
    const lineRefs = React.useRef<LineRefs>({
        bottom: null,
        right: null,
        top: null,
        left: null,
    });

    interface LineCoords {
        [key: string]: number[],
    }
    function lineCoords(
        x1: number, y1: number, x2: number, y2: number
    ): LineCoords {
        return {
            bottom: [x1, y1, x2, y1],
            right: [x2, y1, x2, y2],
            top: [x2, y2, x1, y2],
            left: [x1, y2, x1, y1],
        };
    }

    interface HandleRefs {
        [key: string]: Konva.Rect | null,
    }
    const handleRefs = React.useRef<HandleRefs>({
        bottom: null,
        right: null,
        top: null,
        left: null,
        bottomLeft: null,
        bottomRight: null,
        topLeft: null,
        topRight: null,
    });

    interface HandleCoords {
        [key: string]: Point,
    }
    function handleCoords (
        x1: number, y1: number, x2: number, y2: number
    ): HandleCoords {
        return {
            bottom: {x: (x1 + x2) / 2, y: y1},
            right: {x: x2, y: (y1 + y2) / 2},
            top: {x: (x1 + x2) / 2, y: y2},
            left: {x: x1, y: (y1 + y2) / 2},
            bottomLeft: {x: x1, y: y1},
            bottomRight: {x: x2, y: y1},
            topLeft: {x: x1, y: y2},
            topRight: {x: x2, y: y2},
        };
    }

    interface MoveCoords {
        [key: string]: string[],
    }
    const moveCoords: MoveCoords = {
        bottom: ["y1"],
        right: ["x2"],
        top: ["y2"],
        left: ["x1"],
        bottomLeft: ["x1", "y1"],
        bottomRight: ["x2", "y1"],
        topLeft: ["x1", "y2"],
        topRight: ["x2", "y2"],
    };

    interface HandleCursors {
        [key: string]: string,
    }
    const handleCursors: HandleCursors = {
        bottom: "ns-resize",
        right: "ew-resize",
        top: "ns-resize",
        left: "ew-resize",
        bottomLeft: "nesw-resize",
        bottomRight: "nwse-resize",
        topLeft: "nwse-resize",
        topRight: "nesw-resize",
    };

    interface HandleLines {
        [key: string]: string[],
    }
    const handleLines: HandleLines = {
        bottom: ["bottom"],
        right: ["right"],
        top: ["top"],
        left: ["left"],
        bottomLeft: ["bottom", "left"],
        bottomRight: ["bottom", "right"],
        topLeft: ["top", "left"],
        topRight: ["top", "right"],
    };

    const handlePositions = [
        "bottom", "right", "top", "left",
        "bottomLeft", "bottomRight", "topLeft", "topRight",
    ];

    function updateRect(coords: {x1?: number, y1?: number, x2?: number, y2?: number}) {
        const newX1 = coords.x1 ?? x1;
        const newY1 = coords.y1 ?? y1;
        const newX2 = coords.x2 ?? x2;
        const newY2 = coords.y2 ?? y2;
        const lCoords = lineCoords(newX1, newY1, newX2, newY2);
        for (const side of Object.keys(lineRefs.current)) {
            const line = lineRefs.current[side];
            if (line) {
                line.points(lCoords[side]);
            }
        }

        const scaleX = (newX2 - newX1) / (x2 - x1);
        const scaleY = (newY2 - newY1) / (y2 - y1);
        childRef.current?.x(-x1 * scaleX + newX1);
        childRef.current?.y(-y1 * scaleY + newY1);
        childRef.current?.scaleX(scaleX);
        childRef.current?.scaleY(scaleY);

        const hCoords = handleCoords(x1, y1, x2, y2);
        const newHCoords = handleCoords(newX1, newY1, newX2, newY2);
        for (const pos of Object.keys(handleRefs.current)) {
            const handle = handleRefs.current[pos];
            if (handle) {
                const hCoord = hCoords[pos];
                const newHCoord = newHCoords[pos];
                handle.position({
                    x: newHCoord.x - hCoord.x,
                    y: newHCoord.y - hCoord.y,
                });
            }
        }
    }

    function resetRect() {
        childRef.current?.x(0);
        childRef.current?.y(0);
        childRef.current?.scaleX(1);
        childRef.current?.scaleY(1);

        for (const pos of Object.keys(handleRefs.current)) {
            const handle = handleRefs.current[pos];
            if (handle) {
                handle.x(0);
                handle.y(0);
            }
        }
    }

    props = structuredClone(props);
    if (isHovering) {
        props.stroke = blue[500];
        props.strokeWidth = 3;
    }

    const handleSize = 7;
    const handleColor = amber[500];

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
                {['bottom', 'right', 'top', 'left'].map((side, idx) =>
                    <Line
                        key={idx}
                        ref={(ref) => { lineRefs.current[side] = ref; }}
                        points={lineCoords(x1, y1, x2, y2)[side]}
                        {...props}
                        stroke={props.stroke}
                        strokeWidth={3}
                    />
                )}
                {/* Resize handles for the corners */}
                {handlePositions.map((corner, idx) =>
                    <ResizeHandle
                        key={idx}
                        ref={(handleRef) => { handleRefs.current[corner] = handleRef; }}
                        x={handleCoords(x1, y1, x2, y2)[corner].x}
                        y={handleCoords(x1, y1, x2, y2)[corner].y}
                        handleSize={handleSize}
                        handleColor={handleColor}
                        resizeCursor={handleCursors[corner]}
                        isDragging={isDragging[corner]}
                        setIsDragging={(dragging) => setIsDragging({...isDragging, [corner]: dragging})}
                        onDragMove={(x, y) => {
                            interface Coords {
                                [key: string]: number,
                            }
                            const newCoords: Coords = {
                                x1: x1 + x, y1: y1 + y,
                                x2: x2 + x, y2: y2 + y,
                            };
                            const update: Coords = {};
                            for (const coord of moveCoords[corner]) {
                                update[coord] = newCoords[coord];
                            }
                            updateRect(update);
                            return {
                                x: moveCoords[corner].some(c => c.includes('x'))? x : 0,
                                y: moveCoords[corner].some(c => c.includes('y'))? y : 0,
                            };
                        }}
                        onDragEnd={(x, y, reset) => {
                            const offsetX = x / xyScales.x;
                            const offsetY = y / xyScales.y;
                            interface Bounds {
                                [key: string]: number,
                            }
                            const newBounds: Bounds = {
                                bottom: bounds.bottom + offsetY,
                                right: bounds.right + offsetX,
                                top: bounds.top + offsetY,
                                left: bounds.left + offsetX,
                            };
                            const update: Bounds = {};
                            for (const line of handleLines[corner]) {
                                update[line] = newBounds[line];
                            }
                            setBounds({ ...bounds, ...update });
                            updateNext.current = () => { resetRect(); reset(); };
                        }}
                    />
                )}
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
        ref = null,
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
        ref: React.Ref<Konva.Rect> | null,
    }>
) {

    return (
        <Rect
            ref={ref}
            x={0}
            y={0}
            offsetX={-x + handleSize / 2}
            offsetY={-y + handleSize / 2}
            width={handleSize}
            height={handleSize}
            stroke={handleColor}
            fill={handleColor}
            draggable={true}
            onDragStart={(e) => {
                setIsDragging(true);
            }}
            onDragMove={(e) => {
                e.target.setPosition(onDragMove(e.target.x(), e.target.y()));
                const container = e.target.getStage()?.container();
                if (container) {
                    container.style.cursor = resizeCursor;
                }
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
