import {ResizedGlyph} from "@/app/jamo_layouts";
import {Point} from "@/app/parse_glyph";
import {adjustGlyphThickness, Bounds, glyphActualBounds} from "@/app/font_utils";
import {GlyphView} from "@/app/GlyphView";
import React from "react";
import Konva from "konva";

export function ResizedGlyphView(
    {resizedGlyph, rescale, bounds, ...props}: Readonly<{
        resizedGlyph: ResizedGlyph,
        rescale: (p: Point) => number[],
        bounds: Bounds,
        showPoints?: boolean,
    } & Konva.LineConfig>
) {
    const actualBounds = glyphActualBounds(resizedGlyph.glyph);
    const resizedBounds = resizedGlyph.bounds;
    const targetBounds = {
        left: bounds.left + resizedBounds.left * (bounds.right - bounds.left),
        right: bounds.left + resizedBounds.right * (bounds.right - bounds.left),
        top: bounds.bottom + resizedBounds.top * (bounds.top - bounds.bottom),
        bottom: bounds.bottom + resizedBounds.bottom * (bounds.top - bounds.bottom),
    }

    const xScale = (targetBounds.right - targetBounds.left) / (actualBounds.right - actualBounds.left);
    const yScale = (targetBounds.top - targetBounds.bottom) / (actualBounds.top - actualBounds.bottom);
    const glyph = adjustGlyphThickness(resizedGlyph.glyph, xScale, yScale);

    function glyphRescale(p: Point): number[] {
        return rescale({
            x: targetBounds.left + (p.x - actualBounds.left) * xScale,
            y: targetBounds.bottom + (p.y - actualBounds.bottom) * yScale,
        });
    }

    return (
        <GlyphView
            glyph={glyph}
            rescale={glyphRescale}
            {...props}
        />
    );
}
