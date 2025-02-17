import {Charstring, Cmap4} from "@/app/TTXObject";
import {Glyph} from "@/app/parse_glyph";

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

type Bounds = {
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
        const points = [
            path.start,
            ...path.segments.flatMap((s) => [s.ct1, s.ct2, s.p]),
        ];
        for (const point of points) {
            bounds.left = Math.min(bounds.left, point.x);
            bounds.right = Math.max(bounds.right, point.x);
            bounds.top = Math.max(bounds.top, point.y);
            bounds.bottom = Math.min(bounds.bottom, point.y);
        }
    }

    return bounds;
}
