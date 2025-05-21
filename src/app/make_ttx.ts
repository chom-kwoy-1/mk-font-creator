import {TTXWrapper} from "@/app/TTXObject";
import {Divider, JamoElement, Layout, Layouts, ResizedGlyph} from "@/app/jamo_layouts";
import {makeCharstring} from "@/app/make_glyph";
import {Bounds} from "@/app/font_utils";

function getFocusGlyphBounds(layout: Layout, ttx: TTXWrapper): Bounds {

    function getBounds(divider: Divider | JamoElement): Bounds | null {
        let bounds;
        switch (divider.type) {
            case 'jamo': {
                if (divider.kind === layout.focus) {
                    return {
                        left: 0, right: 1, top: 1, bottom: 0,
                    };
                }
                return null;
            }
            case 'vertical': {
                if ((bounds = getBounds(divider.left))) {
                    return {
                        left: bounds.left * divider.x,
                        right: bounds.right * divider.x,
                        top: bounds.top,
                        bottom: bounds.bottom,
                    };
                }
                if ((bounds = getBounds(divider.right))) {
                    return {
                        left: divider.x + bounds.left * (1 - divider.x),
                        right: divider.x + bounds.right * (1 - divider.x),
                        top: bounds.top,
                        bottom: bounds.bottom,
                    }
                }
                return null;
            }
            case 'horizontal': {
                if ((bounds = getBounds(divider.top))) {
                    return {
                        left: bounds.left,
                        right: bounds.right,
                        top: divider.y + bounds.top * (1 - divider.y),
                        bottom: divider.y + bounds.bottom * (1 - divider.y),
                    }
                }
                if ((bounds = getBounds(divider.bottom))) {
                    return {
                        left: bounds.left,
                        right: bounds.right,
                        top: divider.y * bounds.top,
                        bottom: divider.y * bounds.bottom,
                    }
                }
                return null;
            }
            case "mixed": {
                if ((bounds = getBounds(divider.topLeft))) {
                    return {
                        left: bounds.left * divider.x,
                        right: bounds.right * divider.x,
                        top: bounds.top * (1 - divider.y),
                        bottom: bounds.bottom * (1 - divider.y),
                    }
                }
                if ((bounds = getBounds(divider.rest))) {
                    return bounds;
                }
                return null;
            }
        }
    }

    const os2 = ttx.getOS2();
    const ascender = parseInt(os2.sTypoAscender['@_value']);
    const descender = parseInt(os2.sTypoDescender['@_value']);
    const height = ascender - descender;

    const bounds = getBounds(layout.dividers) as Bounds;

    return {
        left: bounds.left * 1000,
        right: bounds.right * 1000,
        top: descender + bounds.top * height,
        bottom: descender + bounds.bottom * height,
    };
}

export function generateTtx(ttx: TTXWrapper, curLayouts: Layouts) {
    const result = new TTXWrapper(structuredClone(ttx.ttx));

    const layout = curLayouts[0].layouts[0];
    const bounds = getFocusGlyphBounds(layout, result);

    const glyph = layout.glyphs.entries().toArray()[0][1] as ResizedGlyph;
    const charstring = makeCharstring(glyph, bounds);

    const glyphOrder = result.getGlyphOrder();
    glyphOrder.push({
        "@_id": "0",  // this is ignored by the parser
        "@_name": "cid24030",
    });

    const charstrings = result.getCharstrings();
    charstrings.push({
        '@_name': "cid24030",
        '@_fdSelectIndex': "0",
        '#text': charstring,
    });

    const cmap = result.getCmap4();
    cmap.map.push({
        "@_code": "0xff00",
        "@_name": "cid24030",
    });

    const hmtx = result.getHmtx();
    hmtx.push({
        '@_name': "cid24030",
        '@_width': "1000",
        '@_lsb': "0",
    });

    const vmtx = result.getVmtx();
    vmtx.push({
        '@_name': "cid24030",
        '@_height': "1000",
        '@_tsb': "0",
    });

    return result.ttx;
}
