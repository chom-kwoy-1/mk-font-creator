import {ResizedGlyph} from "@/app/jamo_layouts";
import {Point} from "@/app/parse_glyph";
import {grey, orange} from "@mui/material/colors";
import React from "react";
import Konva from "konva";
import {ResizedGlyphView} from "@/app/ResizedGlyphView";
import {ResizeableRect} from "@/app/ResizeableRect";
import {DrawBounds} from "@/app/DrawBounds";

export function ResizeableJamo(
    {
        left, right, top, bottom,
        isFocus,
        ...props
    }: Readonly<{
        left: number,
        right: number,
        top: number,
        bottom: number,
        isFocus: boolean,
        rescale: (p: Point) => number[],
        xyScales: { x: number, y: number },
        resizedGlyph: ResizedGlyph,
        setResizedGlyph: ((resizedGlyph: ResizedGlyph) => void) | null,
        drawBackground: boolean,
        showPoints?: boolean,
    }>
) {
    const {
        rescale,
        xyScales,
        resizedGlyph,
        setResizedGlyph,
        drawBackground,
        showPoints,
    } = props;

    const outlineColor = grey[50];
    const highlightAreaColor = grey[800];

    const ref = React.useRef<Konva.Group>(null);

    if (isFocus) {
        const resizedBounds = resizedGlyph.bounds;

        return (
            <React.Fragment>
                <DrawBounds
                    bounds={{left: left, right: right, top: top, bottom: bottom}}
                    rescale={rescale}
                    fill={drawBackground ? highlightAreaColor : "transparent"}
                />

                {!drawBackground &&
                    <React.Fragment>
                        <ResizedGlyphView
                            stageRef={ref}
                            resizedGlyph={resizedGlyph}
                            rescale={rescale}
                            bounds={{left: left, right: right, top: top, bottom: bottom}}
                            showPoints={showPoints}
                            stroke={outlineColor}
                        />

                        <ResizeableRect
                            bounds={{
                                left: left + resizedBounds.left * (right - left),
                                right: left + resizedBounds.right * (right - left),
                                top: bottom + resizedBounds.top * (top - bottom),
                                bottom: bottom + resizedBounds.bottom * (top - bottom),
                            }}
                            setBounds={(newBounds) => {
                                if (setResizedGlyph !== null) {
                                    setResizedGlyph({
                                        ...resizedGlyph,
                                        bounds: {
                                            left: (newBounds.left - left) / (right - left),
                                            right: (newBounds.right - left) / (right - left),
                                            top: (newBounds.top - bottom) / (top - bottom),
                                            bottom: (newBounds.bottom - bottom) / (top - bottom),
                                        },
                                    });
                                }
                            }}
                            rescale={rescale}
                            xyScales={xyScales}
                            stroke={orange[500]}
                            strokeWidth={1}
                            resizedRefs={[ref.current as Konva.Group]}
                        />
                    </React.Fragment>}
            </React.Fragment>
        );
    } else {
        if (!drawBackground) {
            return (
                <ResizedGlyphView
                    stageRef={ref}
                    resizedGlyph={resizedGlyph}
                    rescale={rescale}
                    bounds={{left: left, right: right, top: top, bottom: bottom}}
                    showPoints={showPoints}
                    stroke={outlineColor}
                />
            );
        }
    }
}
