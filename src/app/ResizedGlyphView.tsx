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
    const newGlyph = structuredClone(glyph);

    console.log("orig glyph", structuredClone(glyph));

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
                if (t === 0.0 || t === 1.0) {
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
            const newSegments: Segment[] = [];
            let newStart = null;
            let isFirst = true;
            let lastPoint = path.start;
            for (const segment of path.segments) {
                const points = [lastPoint, segment.p];
                if (points[0].y < points[1].y && points[0].x < points[1].x) {  // ↗
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

    return removeSelfIntersections(newGlyph);
}

function removeSelfIntersections(glyph: Glyph): Glyph {
    console.log("modified glyph", structuredClone(glyph));

    const newPaths = glyph.paths.map((path, pathIdx) => {
        let newSegments: Segment[] = structuredClone(path.segments);

        let lastPoint = path.start;
        for (let i = 0; i < newSegments.length; i++) {
            let segment = newSegments[i];
            const bezier = new Bezier([
                lastPoint, segment.ct1, segment.ct2, segment.p,
            ]);

            function* nextBeziers(): Generator<[number, Bezier]> {
                let otherLastPoint = segment.p;
                for (let j = i + 1; j < newSegments.length; j++) {
                    const otherSegment = newSegments[j];
                    const otherBezier = new Bezier([
                        otherLastPoint, otherSegment.ct1, otherSegment.ct2, otherSegment.p
                    ]);
                    otherLastPoint = otherSegment.p;
                    yield [j, otherBezier];
                }
                const otherBezier = new Bezier([
                    otherLastPoint, path.start, path.start, path.start
                ]);
                yield [newSegments.length, otherBezier];
            }

            let maxT1 = 0, intersection = null;
            for (const [j, otherBezier] of nextBeziers()) {
                for (const t of bezier.intersects(otherBezier)) {
                    const [t1, t2] = (t as string).split('/').map((s) => parseFloat(s));
                    if (t1 > maxT1) {
                        maxT1 = t1;
                        intersection = {
                            segIndex: j,
                            bezier: otherBezier,
                            t2: t2,
                        };
                    }
                }
            }

            console.log(pathIdx, i, maxT1, intersection);
            if (intersection) {

                const split = bezier.split(maxT1);
                segment = {
                    ct1: split.left.points[1],
                    ct2: split.left.points[2],
                    p: split.left.points[3],
                };

                const otherBezier = intersection.bezier.split(intersection.t2).right;
                const otherSegment = {
                    ct1: otherBezier.points[1],
                    ct2: otherBezier.points[2],
                    p: otherBezier.points[3],
                };

                newSegments = newSegments
                    .slice(0, i)
                    .concat([segment, otherSegment])
                    .concat(newSegments.slice(intersection.segIndex + 1));
            }

            lastPoint = segment.p;
        }
        return {
            start: path.start,
            segments: path.segments,
        };
    });

    return {
        width: glyph.width,
        paths: newPaths,
    };
}
