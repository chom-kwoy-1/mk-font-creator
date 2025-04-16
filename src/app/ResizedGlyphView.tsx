import {ResizedGlyph} from "@/app/jamo_layouts";
import {Point} from "@/app/parse_glyph";
import {Bounds, glyphActualBounds} from "@/app/font_utils";
import {GlyphView} from "@/app/GlyphView";
import React from "react";
import Konva from "konva";

export function ResizedGlyphView(
    {resizedGlyph, rescale, bounds, ...props}: Readonly<{
        resizedGlyph: ResizedGlyph,
        rescale: (p: Point) => number[],
        bounds: Bounds,
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

    function glyphRescale(p: Point): number[] {
        const x = (p.x - actualBounds.left) / (actualBounds.right - actualBounds.left);
        const y = (p.y - actualBounds.bottom) / (actualBounds.top - actualBounds.bottom);
        const x2 = targetBounds.left + x * (targetBounds.right - targetBounds.left);
        const y2 = targetBounds.bottom + y * (targetBounds.top - targetBounds.bottom);
        return rescale({x: x2, y: y2});
    }

    return (
        <GlyphView
            glyph={resizedGlyph.glyph}
            rescale={glyphRescale}
            {...props}
        />
    );
}
