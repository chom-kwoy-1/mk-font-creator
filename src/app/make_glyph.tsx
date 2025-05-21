import {ResizedGlyph} from "@/app/jamo_layouts";
import {Bounds, glyphActualBounds} from "@/app/font_utils";
import {Point} from "@/app/parse_glyph";

export function makeCharstring(resizedGlyph: ResizedGlyph, bounds: Bounds): string {
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

    function glyphRescale(p: Point): number[] {
        return [
            targetBounds.left + (p.x - actualBounds.left) * xScale,
            targetBounds.bottom + (p.y - actualBounds.bottom) * yScale,
        ];
    }

    let result = "";
    let [xOff, yOff] = [0, 0];
    for (const path of resizedGlyph.glyph.paths) {
        let [x, y] = glyphRescale(path.start);
        result += (x - xOff).toFixed(0) + " " + (y - yOff).toFixed(0) + " rmoveto\n";
        [xOff, yOff] = [x, y];
        for (const segment of path.segments) {
            const [ct1x, ct1y] = glyphRescale(segment.ct1);
            result += (ct1x - xOff).toFixed(0) + " " + (ct1y - yOff).toFixed(0) + " ";
            [xOff, yOff] = [ct1x, ct1y];

            const [ct2x, ct2y] = glyphRescale(segment.ct2);
            result += (ct2x - xOff).toFixed(0) + " " + (ct2y - yOff).toFixed(0) + " ";
            [xOff, yOff] = [ct2x, ct2y];

            const [px, py] = glyphRescale(segment.p);
            result += (px - xOff).toFixed(0) + " " + (py - yOff).toFixed(0) + " rrcurveto\n";
            [xOff, yOff] = [px, py];
        }
    }
    result += "endchar";

    return result;
}
