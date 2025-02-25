import {ResizedGlyph} from "@/app/jamo_layouts";
import {Glyph, Path, Point, Segment} from "@/app/parse_glyph";
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
    console.log("orig glyph", structuredClone(glyph));

    const newGlyph = reduceGlyphPaths(glyph);

    console.log("reduced glyph", structuredClone(newGlyph));

    const boldGlyph = synthesizeBoldGlyph(newGlyph, 30);

    console.log("bold glyph", structuredClone(boldGlyph));

    return {
        ...glyph,
        paths: [
            ...boldGlyph.paths,
        ]
    };
}

function synthesizeBoldGlyph(glyph: Glyph, d: number): Glyph {
    const newGlyph = structuredClone(glyph);

    for (const path of newGlyph.paths) {
        const newSegments: Segment[] = [];
        let lastPoint = path.start;
        let lastBezier: Bezier | null = null;
        for (const segment of path.segments) {
            const bezier = new Bezier(structuredClone([
                lastPoint, segment.ct1, segment.ct2, segment.p
            ]));
            const offset = bezier.offset(-d) as Bezier[];
            if (offset.length !== 1) {
                console.error("offset", offset.length, offset);
            }
            const offsetBezier = offset[0];
            if (!lastBezier) {
                path.start = structuredClone(offsetBezier.points[0]);
            }
            else {
                const lastDir = lastBezier.derivative(1.0);
                const curDir = offsetBezier.derivative(0.0);
                const intersect = rayIntersect(
                    lastBezier.points[3], lastDir,
                    offsetBezier.points[0], {x: -curDir.x, y: -curDir.y},
                );
                if (intersect === "degenerate") {
                    // on the same line, do nothing
                }
                else if (intersect === "no intersection") {
                    // sharp corner, add a point
                    // TODO: handle sharp corners properly
                    console.log("intersect", intersect);
                    newSegments.push({
                        ct1: structuredClone(offsetBezier.points[0]),
                        ct2: structuredClone(lastBezier.points[3]),
                        p: structuredClone(offsetBezier.points[0]),
                    });
                }
                else if (typeof intersect !== "string") {
                    newSegments[newSegments.length - 1].p = intersect.p;
                }
            }
            newSegments.push({
                ct1: structuredClone(offsetBezier.points[1]),
                ct2: structuredClone(offsetBezier.points[2]),
                p: structuredClone(offsetBezier.points[3]),
            });
            lastBezier = offsetBezier;
            lastPoint = segment.p;
        }
        path.segments = newSegments;
    }

    return newGlyph;
}

function reduceGlyphPaths(glyph: Glyph): Glyph {
    const newGlyph = structuredClone(glyph);

    for (const path of newGlyph.paths) {
        const newSegments: Segment[] = [];
        let lastPoint = path.start;
        for (const segment of path.segments) {
            const beziers = new Bezier(structuredClone([
                lastPoint, segment.ct1, segment.ct2, segment.p
            ])).reduce();
            for (const bezier of beziers) {
                newSegments.push({
                    ct1: structuredClone(bezier.points[1]),
                    ct2: structuredClone(bezier.points[2]),
                    p: structuredClone(bezier.points[3]),
                });
            }
            const lastSeg = newSegments[newSegments.length - 1];
            if (lastSeg.p.x !== segment.p.x || lastSeg.p.y !== segment.p.y) {
                newSegments.push({
                    ct1: structuredClone(segment.p),
                    ct2: structuredClone(lastSeg.p),
                    p: structuredClone(segment.p),
                });
            }
            lastPoint = segment.p;
        }
        path.segments = newSegments;
    }

    return newGlyph;
}

function rayIntersect(
    p1: Point, d1: Point,
    p2: Point, d2: Point,
): {p: Point, t1: number, t2: number} | string {
    const det = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(det) < 1e-6) {
        return "degenerate";
    }
    const t1 = (d2.y * (p2.x - p1.x) - d2.x * (p2.y - p1.y)) / det;
    const t2 = (d1.y * (p2.x - p1.x) - d1.x * (p2.y - p1.y)) / det;
    if (t1 < 0 || t2 < 0) {
        return "no intersection";
    }
    const p = {
        x: p1.x + t1 * d1.x,
        y: p1.y + t1 * d1.y,
    };
    return {p, t1, t2};
}
