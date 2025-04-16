import {Charstring, Cmap4} from "@/app/TTXObject";
import {Glyph} from "@/app/parse_glyph";
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
    }

    return bounds;
}
