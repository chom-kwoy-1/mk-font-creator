import {Bounds} from "@/app/font_utils";
import {Point} from "@/app/parse_glyph";
import Konva from "konva";
import {Rect} from "react-konva";
import React from "react";

export function DrawBounds(
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