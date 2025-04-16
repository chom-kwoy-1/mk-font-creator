import {Charstring, Cmap4} from "@/app/TTXObject";
import {Glyph, Path, Point, Segment} from "@/app/parse_glyph";
import {Bezier} from "bezier-js";

export function findCharstringByCodepoint(
    codePoint: number,
    cmap4: Cmap4,
    charstrings: Charstring[]
): Charstring {
    let cid: string | null = null;
    cmap4.map.forEach((c) => {
        if (parseInt(c['@_code'], 16) === codePoint) {
            cid = c['@_name'];
        }
    });
    const csIndex = charstrings.findIndex((cs) => cs['@_name'] === cid);
    return charstrings[csIndex];
}

export type Bounds = {
    left: number,
    right: number,
    top: number,
    bottom: number,
};

export function glyphActualBounds(glyph: Glyph): Bounds {
    const bounds = {
        left: Infinity,
        right: -Infinity,
        top: -Infinity,
        bottom: Infinity,
    };

    for (const path of glyph.paths) {
        const bbox = pathBounds(path);
        bounds.left = Math.min(bounds.left, bbox.left);
        bounds.right = Math.max(bounds.right, bbox.right);
        bounds.top = Math.max(bounds.top, bbox.top);
        bounds.bottom = Math.min(bounds.bottom, bbox.bottom);
    }

    return bounds;
}

export function pathBounds(path: Path): Bounds {
    const bounds = {
        left: Infinity,
        right: -Infinity,
        top: -Infinity,
        bottom: Infinity,
    };

    let lastPoint = path.start;
    for (const segment of path.segments) {
        const bezier = new Bezier(structuredClone([
            lastPoint, segment.ct1, segment.ct2, segment.p,
        ]));
        const bbox = bezier.bbox();
        bounds.left = Math.min(bounds.left, bbox.x.min);
        bounds.right = Math.max(bounds.right, bbox.x.max);
        bounds.top = Math.max(bounds.top, bbox.y.max);
        bounds.bottom = Math.min(bounds.bottom, bbox.y.min);
        lastPoint = segment.p;
    }

    return bounds;
}

export function intersectGlyph(
    glyph: Glyph,
    bounds: Bounds,
): Glyph {
    const newPaths = [];
    for (const path of glyph.paths) {
        const bbox = pathBounds(path);
        const bboxArea = (
            Math.max(0, bbox.right - bbox.left) *
            Math.max(0, bbox.top - bbox.bottom)
        );

        const intersection = {
            left: Math.max(bounds.left, bbox.left),
            right: Math.min(bounds.right, bbox.right),
            top: Math.min(bounds.top, bbox.top),
            bottom: Math.max(bounds.bottom, bbox.bottom),
        };
        const intersectionArea = (
            Math.max(0, intersection.right - intersection.left) *
            Math.max(0, intersection.top - intersection.bottom)
        );

        if (intersectionArea / bboxArea >= 0.5) {
            newPaths.push(path);
        }
    }

    return {
        width: glyph.width,
        paths: newPaths,
    };
}

export function adjustGlyphThickness(
    glyph: Glyph,
    xScale: number,
    yScale: number
): Glyph {
    glyph = reduceGlyphPaths(glyph);
    const boldOffset = 40;
    const boldGlyph = synthesizeBoldGlyph(glyph, boldOffset);

    const config = {
        xScale: xScale,
        yScale: yScale,
        xThickness: 100,  // TODO: parse these values from file
        yThickness: 50,
        boldOffset: boldOffset,
        alpha: 0.2,
    };

    const newGlyph = structuredClone(glyph);
    for (let pathIdx = 0; pathIdx < newGlyph.paths.length; pathIdx++) {
        const path = newGlyph.paths[pathIdx];
        const boldPath = boldGlyph.paths[pathIdx];

        path.start = interpolate(path.start, boldPath.start, config);

        const newSegments: Segment[] = [];
        for (let segIdx = 0; segIdx < path.segments.length; segIdx++) {
            const segment = path.segments[segIdx];
            const boldSeg = boldPath.segments[segIdx];

            newSegments.push({
                ct1: interpolate(segment.ct1, boldSeg.ct1, config),
                ct2: interpolate(segment.ct2, boldSeg.ct2, config),
                p: interpolate(segment.p, boldSeg.p, config),
            });
        }
        path.segments = newSegments;
    }

    return newGlyph;
}

function interpolate(
    pr: Point,
    pb: Point,
    {xScale, yScale, xThickness, yThickness, boldOffset, alpha}: Readonly<{
        xScale: number,
        yScale: number,
        xThickness: number,
        yThickness: number,
        boldOffset: number,
        alpha: number,
    }>
): Point {
    const bx = (boldOffset * 2 + xThickness) / xThickness;
    const by = (boldOffset * 2 + yThickness) / yThickness;
    const qx = (Math.pow(xScale, alpha - 1) - bx) / (1 - bx);
    const qy = (Math.pow(yScale, alpha - 1) - by) / (1 - by);
    return {
        x: qx * pr.x + (1 - qx) * pb.x,
        y: qy * pr.y + (1 - qy) * pb.y,
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
                if (typeof intersect !== "string") {
                    // Outward sharp point
                    newSegments[newSegments.length - 1].p = intersect.p;
                }
                else if (intersect === "degenerate") {
                    // On the same line, do nothing
                }
                else if (intersect === "no intersection") {
                    // Inward sharp point
                    let corrected = false;
                    for (let i = newSegments.length - 1; i >= 0; i--) {
                        const seg = newSegments[i];
                        const prevBezier = new Bezier(structuredClone([
                            newSegments[i - 1]?.p ?? path.start,
                            seg.ct1, seg.ct2, seg.p,
                        ]));
                        const intersect = prevBezier.intersects(offsetBezier);
                        if (intersect.length > 0) {
                            const t1_t2 = intersect[intersect.length - 1] as string;
                            const [t1, t2] = t1_t2.split("/").map(parseFloat);
                            const split = prevBezier.split(t1);
                            newSegments[i] = {
                                ct1: structuredClone(split.left.points[1]),
                                ct2: structuredClone(split.left.points[2]),
                                p: structuredClone(split.left.points[3]),
                            };
                            for (let j = i + 1; j < newSegments.length; j++) {
                                newSegments[j] = {
                                    ct1: structuredClone(split.left.points[3]),
                                    ct2: structuredClone(split.left.points[3]),
                                    p: structuredClone(split.left.points[3]),
                                };
                            }
                            corrected = true;
                            break;
                        }
                    }
                    if (!corrected) {
                        console.log("no intersection", offsetBezier);
                    }
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
            const finalPoint = lastSeg? lastSeg.p : lastPoint;
            if (finalPoint.x !== segment.p.x || finalPoint.y !== segment.p.y) {
                newSegments.push({
                    ct1: structuredClone(segment.p),
                    ct2: structuredClone(finalPoint),
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
