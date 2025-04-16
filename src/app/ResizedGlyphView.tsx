import {ResizedGlyph} from "@/app/jamo_layouts";
import {Glyph, Point} from "@/app/parse_glyph";
import {adjustGlyphThickness, Bounds, glyphActualBounds, reduceGlyphPaths, synthesizeBoldGlyph} from "@/app/font_utils";
import {GlyphView} from "@/app/GlyphView";
import React from "react";
import Konva from "konva";

type PropType = Readonly<{
    stageRef?: React.RefObject<Konva.Group | null>,
    resizedGlyph: ResizedGlyph,
    rescale: (p: Point) => number[],
    bounds: Bounds,
    showPoints?: boolean,
} & Konva.LineConfig>;

export function ResizedGlyphView(
    {resizedGlyph, rescale, bounds, ...props}: PropType
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

    const boldOffset = 20;
    const [reducedGlyph, boldGlyph] = React.useMemo(() => {
        console.log("Synthesize bold glyph");
        const reducedGlyph = reduceGlyphPaths(resizedGlyph.glyph);
        return [
            reducedGlyph,
            synthesizeBoldGlyph(reducedGlyph, boldOffset)
        ];
    }, [resizedGlyph.glyph]);
    const adjustedGlyph = React.useMemo(() => {
        return adjustGlyphThickness(reducedGlyph, boldGlyph, boldOffset, xScale, yScale);
    }, [resizedGlyph.glyph, xScale, yScale]);

    function glyphRescale(p: Point): number[] {
        return rescale({
            x: targetBounds.left + (p.x - actualBounds.left) * xScale,
            y: targetBounds.bottom + (p.y - actualBounds.bottom) * yScale,
        });
    }

    return (
        <GlyphView
            glyph={adjustedGlyph}
            rescale={glyphRescale}
            {...props}
        />
    );
}