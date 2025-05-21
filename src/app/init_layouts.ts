import {Divider, JamoElement, JamoKind, jamoLayouts, JamoSubkind, Layouts, ResizedGlyph} from "@/app/jamo_layouts";
import {Bounds, findCharstringByCodepoint, glyphActualBounds, intersectGlyph} from "@/app/font_utils";
import {TTXWrapper} from "@/app/TTXObject";
import {Glyph, parseGlyph} from "@/app/parse_glyph";
import {exampleJamo, jamoTable} from "@/app/jamos";
import {uniToPua} from "@/app/pua_uni_conv";


export function initLayouts(ttx: TTXWrapper): Layouts {
    const fdarray = ttx.getFDArray();
    const charstrings = ttx.getCharstrings();
    const os2 = ttx.getOS2();
    const cmap4 = ttx.getCmap4();

    let layouts = structuredClone(jamoLayouts);

    const ascender = parseInt(os2.sTypoAscender[0]['@_value']);
    const descender = parseInt(os2.sTypoDescender[0]['@_value']);

    // Initialize glyphs with positional variants
    layouts = layouts.map(
        (category) => {
            return {
                ...category,
                layouts: category.layouts.map((layout) => {
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
                }),
            };
        }
    );

    // Fill in missing glyphs with individual unicode codepoints
    layouts = layouts.map(
        (category) => {
            return {
                ...category,
                layouts: category.layouts.map((layout) => {
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
                }),
            };
        }
    );

    return layouts;
}

function getIntersectingGlyph(
    divider: Divider | JamoElement,
    focusKind: JamoKind,
    glyph: Glyph,
    bounds: Bounds | Bounds[],
): {
    'glyph': Glyph,
    'bounds': Bounds
} | null {
    switch (divider.type) {
        case 'jamo': {
            if (divider.kind == focusKind) {
                if (!(bounds instanceof Array)) {
                    bounds = [bounds];
                }
                const newGlyph = intersectGlyph(glyph, bounds);
                const actualBounds = glyphActualBounds(newGlyph);

                const hull = bounds[0];
                for (const b of bounds) {
                    hull.left = Math.min(hull.left, b.left);
                    hull.right = Math.max(hull.right, b.right);
                    hull.top = Math.max(hull.top, b.top);
                    hull.bottom = Math.min(hull.bottom, b.bottom);
                }

                return {
                    'glyph': newGlyph,
                    'bounds': {
                        'left': (actualBounds.left - hull.left) / (hull.right - hull.left),
                        'right': (actualBounds.right - hull.left) / (hull.right - hull.left),
                        'top': (actualBounds.top - hull.bottom) / (hull.top - hull.bottom),
                        'bottom': (actualBounds.bottom - hull.bottom) / (hull.top - hull.bottom),
                    },
                };
            }
            return null;
        }
        case 'vertical': {
            bounds = bounds as Bounds;
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
            bounds = bounds as Bounds;
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
            bounds = bounds as Bounds;
            const x = bounds.left + divider.x * (bounds.right - bounds.left);
            const y = bounds.bottom + divider.y * (bounds.top - bounds.bottom);
            return (
                getIntersectingGlyph(divider.topLeft, focusKind, glyph, {
                    left: bounds.left,
                    right: x,
                    top: bounds.top,
                    bottom: y,
                }) ??
                getIntersectingGlyph(divider.rest, focusKind, glyph, [
                    {left: x, right: bounds.right, top: bounds.top, bottom: y},
                    {left: bounds.left, right: bounds.right, top: y, bottom: bounds.bottom},
                ])
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
