import {ResizedGlyph} from "@/app/jamo_layouts";
import {Glyph, Point, Segment} from "@/app/parse_glyph";
import {Bounds, glyphActualBounds} from "@/app/font_utils";
import {GlyphView} from "@/app/GlyphView";
import React from "react";
import Konva from "konva";
import {Bezier} from "bezier-js";

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
    const glyph = adjustGlyphThickness(resizedGlyph.glyph, yScale / xScale);

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

function adjustGlyphThickness(glyph: Glyph, xyRatio: number): Glyph {
    const newGlyph = structuredClone(glyph);

    // Split each segment at its extrema
    for (const path of newGlyph.paths) {
        let lastPoint = path.start;
        const newSegments: Segment[] = [];
        for (const segment of path.segments) {
            let bezier = new Bezier([
                lastPoint, segment.ct1, segment.ct2, segment.p,
            ]);
            const extrema = bezier.extrema();
            for (const t of extrema.values) {
                const split = bezier.split(t);
                if (t == 0 || t == 1) {
                    continue;
                }
                newSegments.push({
                    ct1: split.left.points[1],
                    ct2: split.left.points[2],
                    p: split.left.points[3],
                });
                bezier = split.right;
            }
            newSegments.push({
                ct1: bezier.points[1],
                ct2: bezier.points[2],
                p: bezier.points[3],
            });
            lastPoint = segment.p;
        }
        path.segments = newSegments;
    }

    const strength = 2.0; //0.4;
    if (xyRatio > 1) {  // stretching vertically
        // first stretch horizontally
        const thickness = 50; // TODO: get this value from FontDict
        // TODO
    }
    else {  // stretching horizontally
        // first stretch vertically
        const thickness = 100; // TODO: get this value from FontDict
        const d = (1 / xyRatio - 1) * thickness * strength;
        for (const path of newGlyph.paths) {
            let lastPoint = path.start;
            let isFirst = true;
            const newSegments: Segment[] = [];
            let newStart = null;
            for (const segment of path.segments) {
                const points = [lastPoint, segment.p];
                if (points[0].y < points[1].y && points[0].x < points[1].x) {  // ↗
                    if (isFirst) {
                        newStart = {x: path.start.x, y: path.start.y};
                    }
                    newSegments.push({
                        ct1: {x: lastPoint.x, y: lastPoint.y - d / 2},
                        ct2: {x: lastPoint.x, y: lastPoint.y - d / 2},
                        p: {x: lastPoint.x, y: lastPoint.y - d / 2},
                    });
                    newSegments.push({
                        ct1: {x: segment.ct1.x, y: segment.ct1.y - d / 2},
                        ct2: {x: segment.ct2.x, y: segment.ct2.y - d / 2},
                        p: {x: segment.p.x, y: segment.p.y - d / 2},
                    });
                }
                else if (points[0].y < points[1].y && points[0].x >= points[1].x) {  // ↖
                    if (isFirst) {
                        newStart = {x: path.start.x, y: path.start.y + d / 2};
                    }
                    newSegments.push({
                        ct1: {x: lastPoint.x, y: lastPoint.y + d / 2},
                        ct2: {x: lastPoint.x, y: lastPoint.y + d / 2},
                        p: {x: lastPoint.x, y: lastPoint.y + d / 2},
                    });
                    newSegments.push({
                        ct1: {x: segment.ct1.x, y: segment.ct1.y + d / 2},
                        ct2: {x: segment.ct2.x, y: segment.ct2.y + d / 2},
                        p: {x: segment.p.x, y: segment.p.y + d / 2},
                    });
                }
                else if (points[0].y >= points[1].y && points[0].x < points[1].x) {  // ↘
                    if (isFirst) {
                        newStart = {x: path.start.x, y: path.start.y - d / 2};
                    }
                    newSegments.push({
                        ct1: {x: lastPoint.x, y: lastPoint.y - d / 2},
                        ct2: {x: lastPoint.x, y: lastPoint.y - d / 2},
                        p: {x: lastPoint.x, y: lastPoint.y - d / 2},
                    });
                    newSegments.push({
                        ct1: {x: segment.ct1.x, y: segment.ct1.y - d / 2},
                        ct2: {x: segment.ct2.x, y: segment.ct2.y - d / 2},
                        p: {x: segment.p.x, y: segment.p.y - d / 2},
                    });
                }
                else {  // ↙
                    if (isFirst) {
                        newStart = {x: path.start.x, y: path.start.y + d / 2};
                    }
                    newSegments.push({
                        ct1: {x: lastPoint.x, y: lastPoint.y + d / 2},
                        ct2: {x: lastPoint.x, y: lastPoint.y + d / 2},
                        p: {x: lastPoint.x, y: lastPoint.y + d / 2},
                    });
                    newSegments.push({
                        ct1: {x: segment.ct1.x, y: segment.ct1.y + d / 2},
                        ct2: {x: segment.ct2.x, y: segment.ct2.y + d / 2},
                        p: {x: segment.p.x, y: segment.p.y + d / 2},
                    });
                }
                lastPoint = segment.p;
                isFirst = false;
            }
            path.start = newStart as Point;
            path.segments = newSegments;
        }
    }

    return newGlyph;
}
