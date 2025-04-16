import {Charstring, FontDict} from "@/app/TTXObject";
import {Bezier} from "bezier-js";

export type Point = {
    x: number,
    y: number,
};

export type Segment = {
    ct1: Point,
    ct2: Point,
    p: Point,
}

export type Path = {
    start: Point,
    segments: Segment[],
};

export type Glyph = {
    paths: Path[],
    width: number,
};

export function parseGlyph(
    charstring: Charstring,
    fdarray: FontDict[],
): Glyph {
    const fdSelectIndex = parseInt(charstring['@_fdSelectIndex']);
    const fontDict = fdarray[fdSelectIndex];
    const defaultWidth = parseInt(fontDict.Private.defaultWidthX['@_value']);
    const nominalWidth = parseInt(fontDict.Private.nominalWidthX['@_value']);

    const lines = charstring['#text'].split("\n").map((line) => {
        return line.trim().split(' ').map((token) => {
            const num = parseInt(token);
            return Number.isNaN(num) ? token : num;
        });
    });

    const glyph: Glyph = {
        paths: [],
        width: defaultWidth,
    };

    const pos: Point = {x: 0, y: 0};

    function moveto({x, y}: Point) {
        glyph.paths.push({start: {x: x, y: y}, segments: []});
    }
    function lineto({x, y}: Point) {
        const lastPath = glyph.paths[glyph.paths.length - 1];
        const lastSeg = lastPath.segments[lastPath.segments.length - 1];
        lastPath.segments.push({
            ct1: {x: x, y: y},
            ct2: structuredClone(lastSeg.p),
            p: {x: x, y: y},
        });
    }
    function curveto(ct1: Point, ct2: Point, p: Point) {
        glyph.paths[glyph.paths.length - 1].segments.push({
            ct1: structuredClone(ct1),
            ct2: structuredClone(ct2),
            p: structuredClone(p),
        });
    }

    for (let opIdx = 0; opIdx < lines.length; opIdx++) {
        const line = lines[opIdx];
        const op_idx = line.findIndex((token) => typeof token === 'string');
        const op = line[op_idx] as string;
        const stack = line.slice(0, op_idx) as number[];

        if (opIdx === 0) {
            const isEvenOp = ['hstem', 'hstemhm', 'vstem', 'vstemhm',
                'cntrmask', 'hintmask', 'rmoveto', 'endchar'].includes(op);
            const isUnaryOp = ['hmoveto', 'vmoveto'].includes(op);
            const isSubrOp = ['endchar', 'callsubr', 'callgsubr', 'return'].includes(op);

            if (!isEvenOp && !isUnaryOp && !isSubrOp) {
                throw Error("Invalid first operator.");
            }

            if ((stack.length % 2 === 1 && isEvenOp)
                || (stack.length === 2 && isUnaryOp))
            {
                glyph.width = nominalWidth + (stack[0]);
                stack.shift();
            }
        }

        if (op === 'rmoveto') {
            if (stack.length !== 2) {
                throw Error("Invalid number of arguments for rmoveto.");
            }
            pos.x += stack[0];
            pos.y += stack[1];
            moveto(pos);
        }
        else if (op === 'hmoveto') {
            if (stack.length !== 1) {
                throw Error("Invalid number of arguments for hmoveto.");
            }
            pos.x += stack[0];
            moveto(pos);
        }
        else if (op === 'vmoveto') {
            if (stack.length !== 1) {
                throw Error("Invalid number of arguments for vmoveto.");
            }
            pos.y += stack[0];
            moveto(pos);
        }
        else if (op === 'rlineto') {
            if (stack.length === 0 || stack.length % 2 !== 0) {
                throw Error("Invalid number of arguments for rlineto.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            // lines
            for (let i = 0; i < stack.length; i += 2) {
                pos.x += stack[i];
                pos.y += stack[i + 1];
                lineto(pos);
            }
        }
        else if (op === 'hlineto') {
            if (stack.length === 0) {
                throw Error("Invalid number of arguments for hlineto.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            // alternating horizontal/vertical lines
            for (let i = 0; i < stack.length; i += 2) {
                // horizontal line
                pos.x += stack[i];
                lineto(pos);
                // vertical line
                if (i + 1 < stack.length) {
                    pos.y += stack[i + 1];
                    lineto(pos);
                }
            }
        }
        else if (op === 'vlineto') {
            if (stack.length === 0) {
                throw Error("Invalid number of arguments for vlineto.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            // alternating vertical/horizontal lines
            for (let i = 0; i < stack.length; i += 2) {
                // vertical line
                pos.y += stack[i];
                lineto(pos);
                // horizontal line
                if (i + 1 < stack.length) {
                    pos.x += stack[i + 1];
                    lineto(pos);
                }
            }
        }
        else if (op === 'rrcurveto') {
            if (stack.length === 0 || stack.length % 6 !== 0) {
                throw Error("Invalid number of arguments for rrcurveto.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            // cubic Bézier curves
            for (let i = 0; i < stack.length; i += 6) {
                pos.x += stack[i];
                pos.y += stack[i + 1];
                const ct1 = structuredClone(pos);
                pos.x += stack[i + 2];
                pos.y += stack[i + 3];
                const ct2 = structuredClone(pos);
                pos.x += stack[i + 4];
                pos.y += stack[i + 5];
                curveto(ct1, ct2, pos);
            }
        }
        else if (op === 'hhcurveto') {
            if (stack.length === 0 || stack.length % 4 >= 2) {
                throw Error("Invalid number of arguments for hhcurveto.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            if (stack.length % 4 === 1) {
                pos.y += stack[0];
                stack.shift();
            }

            // cubic Bézier curves
            for (let i = 0; i < stack.length; i += 4) {
                pos.x += stack[i];
                const ct1 = structuredClone(pos);
                pos.x += stack[i + 1];
                pos.y += stack[i + 2];
                const ct2 = structuredClone(pos);
                pos.x += stack[i + 3];
                curveto(ct1, ct2, pos);
            }
        }
        else if (op === 'hvcurveto') {
            if (stack.length === 0 || [2, 3, 6, 7].includes(stack.length % 8)) {
                throw Error("Invalid number of arguments for hvcurveto.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            // alternate start horizontal, end vertical and
            // start vertical, end horizontal
            for (let i = 0; i + 1 < stack.length; i += 8) {
                pos.x += stack[i];
                const ct1 = structuredClone(pos);
                pos.x += stack[i + 1];
                pos.y += stack[i + 2];
                const ct2 = structuredClone(pos);
                pos.y += stack[i + 3];
                if (i + 5 === stack.length) {
                    pos.x += stack[i + 4];
                }
                curveto(ct1, ct2, pos);

                if (stack.length < i + 8) {
                    break;
                }

                pos.y += stack[i + 4];
                const ct3 = structuredClone(pos);
                pos.x += stack[i + 5];
                pos.y += stack[i + 6];
                const ct4 = structuredClone(pos);
                pos.x += stack[i + 7];
                if (i + 9 === stack.length) {
                    pos.y += stack[i + 8];
                }
                curveto(ct3, ct4, pos);
            }
        }
        else if (op === 'rcurveline') {
            if (stack.length % 6 !== 2) {
                throw Error("Invalid number of arguments for rcurveline.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            // cubic Bézier curves
            for (let i = 0; i < stack.length - 2; i += 6) {
                pos.x += stack[i];
                pos.y += stack[i + 1];
                const ct1 = structuredClone(pos);
                pos.x += stack[i + 2];
                pos.y += stack[i + 3];
                const ct2 = structuredClone(pos);
                pos.x += stack[i + 4];
                pos.y += stack[i + 5];
                curveto(ct1, ct2, pos);
            }

            // followed by a line
            pos.x += stack[stack.length - 2];
            pos.y += stack[stack.length - 1];
            lineto(pos);
        }
        else if (op === 'rlinecurve') {
            if (stack.length < 8 || stack.length % 2 !== 0) {
                throw Error("Invalid number of arguments for rlinecurve.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            // lines
            for (let i = 0; i < stack.length - 6; i += 2) {
                pos.x += stack[i];
                pos.y += stack[i + 1];
                lineto(pos);
            }

            // followed by a cubic Bézier curve
            pos.x += stack[stack.length - 6];
            pos.y += stack[stack.length - 5];
            const ct1 = structuredClone(pos);
            pos.x += stack[stack.length - 4];
            pos.y += stack[stack.length - 3];
            const ct2 = structuredClone(pos);
            pos.x += stack[stack.length - 2];
            pos.y += stack[stack.length - 1];
            curveto(ct1, ct2, pos);
        }
        else if (op === 'vhcurveto') {
            if (stack.length === 0 || [2, 3, 6, 7].includes(stack.length % 8)) {
                throw Error("Invalid number of arguments for vhcurveto.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            // alternate start vertical, end horizontal and
            // start horizontal, end vertical
            for (let i = 0; i + 1 < stack.length; i += 8) {
                pos.y += stack[i];
                const ct1 = structuredClone(pos);
                pos.x += stack[i + 1];
                pos.y += stack[i + 2];
                const ct2 = structuredClone(pos);
                pos.x += stack[i + 3];
                if (i + 5 === stack.length) {
                    pos.y += stack[i + 4];
                }
                curveto(ct1, ct2, pos);

                if (stack.length < i + 8) {
                    break;
                }

                pos.x += stack[i + 4];
                const ct3 = structuredClone(pos);
                pos.x += stack[i + 5];
                pos.y += stack[i + 6];
                const ct4 = structuredClone(pos);
                pos.y += stack[i + 7];
                if (i + 9 === stack.length) {
                    pos.x += stack[i + 8];
                }
                curveto(ct3, ct4, pos);
            }
        }
        else if (op === 'vvcurveto') {
            if (stack.length === 0 || stack.length % 4 >= 2) {
                throw Error("Invalid number of arguments for vvcurveto.");
            }

            if (glyph.paths.length === 0) {
                moveto(pos);
            }

            if (stack.length % 4 === 1) {
                pos.x += stack[0];
                stack.shift();
            }

            // cubic Bézier curves
            for (let i = 0; i < stack.length; i += 4) {
                pos.y += stack[i];
                const ct1 = structuredClone(pos);
                pos.x += stack[i + 1];
                pos.y += stack[i + 2];
                const ct2 = structuredClone(pos);
                pos.y += stack[i + 3];
                curveto(ct1, ct2, pos);
            }
        }
        else if (['hstem', 'vstem', 'hstemhm', 'vstemhm', 'hintmask', 'cntrmask'].includes(op)) {
            // Ignore hint operators for now
        }
        else if (op === 'endchar') {
            if (stack.length !== 0) {
                throw Error("Stack not empty when finishing glyph.");
            }
            break;
        }
        else {
            throw Error("Unknown operator: " + op);
        }
    }

    return correctDirection(glyph);
}

function correctDirection(glyph: Glyph): Glyph {
    const newGlyph = structuredClone(glyph);
    const outsidePath = {x: 2000, y: 2000};

    newGlyph.paths = newGlyph.paths.map((path) => {
        const windingDir = windingDirection(path);

        let n = numIntersections(
            newGlyph.paths.filter((otherPath) => !Object.is(otherPath, path)),
            {p1: outsidePath, p2: path.start},
        );

        console.log(n, windingDir);

        if (n % 2 === 0 && windingDir === 'CW' ||
            n % 2 === 1 && windingDir === 'CCW') {
            return reversePath(path);
        }

        return path;
    });

    return newGlyph;
}

function reversePath(path: Path): Path {
    const newPath: Path = {
        start: structuredClone(path.segments[path.segments.length - 1].p),
        segments: [],
    };

    for (let i = path.segments.length - 1; i >= 1; i--) {
        newPath.segments.push({
            ct1: structuredClone(path.segments[i].ct2),
            ct2: structuredClone(path.segments[i].ct1),
            p: structuredClone(path.segments[i - 1].p),
        });
    }
    newPath.segments.push({
        ct1: structuredClone(path.segments[0].ct2),
        ct2: structuredClone(path.segments[0].ct1),
        p: structuredClone(path.start),
    });

    return newPath;
}

function numIntersections(
    paths: Path[],
    line: {p1: Point, p2: Point},
): number {
    let numIntersections = 0;
    for (const path of paths) {
        let lastPoint = path.start;
        for (const segment of path.segments) {
            const bezier = new Bezier(structuredClone([
                lastPoint, segment.ct1, segment.ct2, segment.p,
            ]));
            const intersections = bezier.intersects(line);
            numIntersections += intersections.length;
            lastPoint = segment.p;
        }
        const bezier = new Bezier(structuredClone([
            lastPoint, path.start, path.start, path.start
        ]));
        const intersections = bezier.intersects(line);
        numIntersections += intersections.length;
    }
    return numIntersections;
}

function windingDirection(path: Path): string {
    let windingNum = 0;
    let lastPoint = path.start;
    for (const segment of path.segments) {
        windingNum += winding(lastPoint, segment.ct1);
        windingNum += winding(segment.ct1, segment.ct2);
        windingNum += winding(segment.ct2, segment.p);
        lastPoint = segment.p;
    }
    windingNum += winding(lastPoint, path.start);
    return windingNum > 0? 'CW' : 'CCW';
}

function winding(p1: Point, p2: Point): number {
    return (p2.x - p1.x) * (p2.y + p1.y);
}
