import {ResizedGlyph} from "@/app/jamo_layouts";
import {Point} from "@/app/parse_glyph";
import {amber, grey, orange} from "@mui/material/colors";
import React from "react";
import Konva from "konva";
import {ResizedGlyphView} from "@/app/ResizedGlyphView";
import {ResizeableRect} from "@/app/ResizeableRect";
import {DrawBounds} from "@/app/DrawBounds";
import {Portal} from 'react-konva-utils';

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
        showPoints?: boolean,
        isHovering: boolean,
    }>
) {
    const {
        rescale,
        xyScales,
        resizedGlyph,
        setResizedGlyph,
        showPoints,
        isHovering,
    } = props;

    const outlineColor = grey[50];
    const highlightAreaColor = grey[800];

    if (isFocus) {
        const resizedBounds = resizedGlyph.bounds;

        return (
            <React.Fragment>
                <Portal selector={".background-layer"}>
                    <DrawBounds
                        bounds={{left: left, right: right, top: top, bottom: bottom}}
                        rescale={rescale}
                        fill={highlightAreaColor}
                    />
                </Portal>

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
                    stroke={isHovering? orange[500] : grey[400]}
                    strokeWidth={isHovering? 3 : 0.5}
                    handleSize={isHovering? 7 : 0}
                    handleColor={amber[500]}
                >
                    <ResizedGlyphView
                        resizedGlyph={resizedGlyph}
                        rescale={rescale}
                        bounds={{left: left, right: right, top: top, bottom: bottom}}
                        showPoints={showPoints}
                        stroke={outlineColor}
                    />
                </ResizeableRect>
            </React.Fragment>
        );
    } else {
        return (
            <ResizedGlyphView
                resizedGlyph={resizedGlyph}
                rescale={rescale}
                bounds={{left: left, right: right, top: top, bottom: bottom}}
                showPoints={showPoints}
                stroke={outlineColor}
            />
        );
    }
}
