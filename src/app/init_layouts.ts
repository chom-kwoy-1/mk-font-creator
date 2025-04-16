import {Divider, JamoElement, JamoKind, jamoLayouts, JamoSubkind, Layout, ResizedGlyph} from "@/app/jamo_layouts";
import {Bounds, findCharstringByCodepoint, glyphActualBounds, intersectGlyph} from "@/app/font_utils";
import {Charstring, Cmap4, FontDict, OS2} from "@/app/TTXObject";
import {Glyph, parseGlyph} from "@/app/parse_glyph";
import {exampleJamo, getExampleJamo, jamoTable} from "@/app/jamos";
import {uniToPua} from "@/app/pua_uni_conv";


export function initLayouts(
    cmap4: Cmap4,
    charstrings: Charstring[],
    fdarray: FontDict[],
    os2: OS2,
): Layout[] {
    let layouts = structuredClone(jamoLayouts);

    const ascender = parseInt(os2.sTypoAscender['@_value']);
    const descender = parseInt(os2.sTypoDescender['@_value']);

    // Initialize glyphs with positional variants
    layouts = layouts.map(
        (layout) => {
            for (const jamo of layout.glyphs.keys()) {
                const syllable = genSyllables(layout.dividers, layout.focus, jamo)
                    .find((s) => uniToPua(s).length === 1);
                if (!syllable) {
                    continue;
                }
                const cs = findCharstringByCodepoint(
                    uniToPua(syllable).codePointAt(0) as number,
                    cmap4,
                    charstrings,
                );
                const resizedGlyph = getIntersectingGlyph(
                    layout.dividers,
                    layout.focus,
                    parseGlyph(cs, fdarray),
                    {left: 0, right: 1000, top: ascender, bottom: descender},
                );
                if (resizedGlyph) {
                    layout.glyphs.set(jamo, resizedGlyph);
                }
            }
            return layout;
        }
    )

    // Fill in glyphs with individual unicode codepoints
    layouts = layouts.map(
        (layout) => {
            for (const jamo of layout.glyphs.keys()) {
                if (layout.glyphs.get(jamo) === null) {
                    // Set default glyph with Unicode codepoint, if exists
                    const cs = findCharstringByCodepoint(
                        jamo.codePointAt(0) as number,
                        cmap4,
                        charstrings,
                    );
                    const glyph = parseGlyph(cs, fdarray);
                    const newResizedGlyph: ResizedGlyph = {
                        glyph: glyph,
                        bounds: {left: 0.2, right: 0.8, top: 0.8, bottom: 0.2},
                    };
                    layout.glyphs.set(jamo, newResizedGlyph);
                }
            }
            return layout;
        }
    );

    return layouts;
}

function getIntersectingGlyph(
    divider: Divider | JamoElement,
    focusKind: JamoKind,
    glyph: Glyph,
    bounds: Bounds,
): {
    'glyph': Glyph,
    'bounds': Bounds
} | null {
    switch (divider.type) {
        case 'jamo': {
            if (divider.kind == focusKind) {
                const newGlyph = intersectGlyph(glyph, bounds);
                const actualBounds = glyphActualBounds(newGlyph);

                return {
                    'glyph': newGlyph,
                    'bounds': {
                        'left': (actualBounds.left - bounds.left) / (bounds.right - bounds.left),
                        'right': (actualBounds.right - bounds.left) / (bounds.right - bounds.left),
                        'top': (actualBounds.top - bounds.bottom) / (bounds.top - bounds.bottom),
                        'bottom': (actualBounds.bottom - bounds.bottom) / (bounds.top - bounds.bottom),
                    },
                };
            }
            return null;
        }
        case 'vertical': {
            const x = bounds.left + divider.x * (bounds.right - bounds.left);
            return (
                getIntersectingGlyph(divider.left, focusKind, glyph, {
                    left: bounds.left,
                    right: x,
                    top: bounds.top,
                    bottom: bounds.bottom,
                }) ??
                getIntersectingGlyph(divider.right, focusKind, glyph, {
                    left: x,
                    right: bounds.right,
                    top: bounds.top,
                    bottom: bounds.bottom,
                })
            );
        }
        case 'horizontal': {
            const y = bounds.bottom + divider.y * (bounds.top - bounds.bottom);
            return (
                getIntersectingGlyph(divider.top, focusKind, glyph, {
                    left: bounds.left,
                    right: bounds.right,
                    top: bounds.top,
                    bottom: y,
                }) ??
                getIntersectingGlyph(divider.bottom, focusKind, glyph, {
                    left: bounds.left,
                    right: bounds.right,
                    top: y,
                    bottom: bounds.bottom,
                })
            );
        }
        case 'mixed': {
            const x = bounds.left + divider.x * (bounds.right - bounds.left);
            const y = bounds.bottom + divider.y * (bounds.top - bounds.bottom);
            return (
                getIntersectingGlyph(divider.topLeft, focusKind, glyph, {
                    left: bounds.left,
                    right: x,
                    top: bounds.top,
                    bottom: y,
                }) ??
                getIntersectingGlyph(divider.rest, focusKind, glyph, bounds)  // FIXME
            );
        }
    }
}

function* genSyllables(
    divider: Divider | JamoElement,
    focusKind: JamoKind,
    focusJamo: string,
): Generator<string> {
    switch (divider.type) {
        case 'jamo':
            if (divider.kind == focusKind) {
                yield focusJamo;
            }
            else {
                yield* Object.keys(jamoTable)
                    .flatMap((kind) => {
                        if (divider.subkind && kind == divider.subkind
                            || kind.endsWith(divider.kind)) {
                            return [exampleJamo[kind], ...jamoTable[kind as JamoSubkind]];
                        }
                        return [];
                    });
            }
            break;
        case 'vertical':
            for (const left of genSyllables(divider.left, focusKind, focusJamo)) {
                for (const right of genSyllables(divider.right, focusKind, focusJamo)) {
                    yield left + right;
                }
            }
            break;
        case 'horizontal':
            for (const top of genSyllables(divider.top, focusKind, focusJamo)) {
                for (const bottom of genSyllables(divider.bottom, focusKind, focusJamo)) {
                    yield top + bottom;
                }
            }
            break;
        case 'mixed':
            for (const topLeft of genSyllables(divider.topLeft, focusKind, focusJamo)) {
                for (const rest of genSyllables(divider.rest, focusKind, focusJamo)) {
                    yield topLeft + rest;
                }
            }
            break;
    }
}
