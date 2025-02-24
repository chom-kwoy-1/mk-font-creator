import {Charstring, Cmap4} from "@/app/TTXObject";
import {Glyph, Path} from "@/app/parse_glyph";
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
        const bezier = new Bezier([
            lastPoint, segment.ct1, segment.ct2, segment.p,
        ]);
        const bbox = bezier.bbox();
        bounds.left = Math.min(bounds.left, bbox.x.min);
        bounds.right = Math.max(bounds.right, bbox.x.max);
        bounds.top = Math.max(bounds.top, bbox.y.max);
        bounds.bottom = Math.min(bounds.bottom, bbox.y.min);
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
