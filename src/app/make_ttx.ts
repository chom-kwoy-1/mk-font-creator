import {LigatureSubst, TTXWrapper} from "@/app/TTXObject";
import {Divider, JamoElement, Layout, Layouts} from "@/app/jamo_layouts";
import {makeCharstring} from "@/app/make_glyph";
import {Bounds} from "@/app/font_utils";
import {getJamos} from "@/app/jamos";
import {PUA_CONV_TAB} from "@/app/pua_uni_table";

export function generateTtx(ttx: TTXWrapper, curLayouts: Layouts) {
    const result = new TTXWrapper(structuredClone(ttx.ttx));

    const glyphOrder = result.getGlyphOrder();
    const charstrings = result.getCharstrings();
    const gsub = result.getGsub();
    const hmtx = result.getHmtx();
    const vmtx = result.getVmtx();

    let lastGlyphId = parseInt(glyphOrder[glyphOrder.length - 1]["@_name"].slice(3));

    // Add ljmo feature to the feature list
    const ljmoFeature = {
        "@_index": gsub.FeatureList[0].FeatureRecord.length.toFixed(0),
        FeatureTag: [{ "@_value": "ljmo" }],
        Feature: [{
            LookupListIndex: [] as {
                '@_index': string,
                '@_value': string,
            }[],
        }],
    };
    gsub.FeatureList[0].FeatureRecord.push(ljmoFeature);

    // Add vjmo feature to the feature list
    const vjmoFeature = {
        "@_index": gsub.FeatureList[0].FeatureRecord.length.toFixed(0),
        FeatureTag: [{ "@_value": "vjmo" }],
        Feature: [{
            LookupListIndex: [] as {
                '@_index': string,
                '@_value': string,
            }[],
        }],
    };
    gsub.FeatureList[0].FeatureRecord.push(vjmoFeature);

    // Add tjmo feature to the feature list
    const tjmoFeature = {
        "@_index": gsub.FeatureList[0].FeatureRecord.length.toFixed(0),
        FeatureTag: [{ "@_value": "tjmo" }],
        Feature: [{
            LookupListIndex: [] as {
                '@_index': string,
                '@_value': string,
            }[],
        }],
    };
    gsub.FeatureList[0].FeatureRecord.push(tjmoFeature);

    // Add ligature feature to the feature list
    const ccmpFeature = {
        "@_index": gsub.FeatureList[0].FeatureRecord.length.toFixed(0),
        FeatureTag: [{ "@_value": "ccmp" }],
        Feature: [{
            LookupListIndex: [] as {
                '@_index': string,
                '@_value': string,
            }[],
        }],
    }
    gsub.FeatureList[0].FeatureRecord.push(ccmpFeature);

    // Enable features for default language system
    const defaultFeatures = gsub
        .ScriptList[0]
        .ScriptRecord[0]
        .Script[0]
        .DefaultLangSys[0]
        .FeatureIndex;
    defaultFeatures.push({
        "@_index": defaultFeatures.length.toFixed(0),
        "@_value": ccmpFeature["@_index"],
    });
    defaultFeatures.push({
        "@_index": defaultFeatures.length.toFixed(0),
        "@_value": ljmoFeature["@_index"],
    });
    defaultFeatures.push({
        "@_index": defaultFeatures.length.toFixed(0),
        "@_value": vjmoFeature["@_index"],
    });
    defaultFeatures.push({
        "@_index": defaultFeatures.length.toFixed(0),
        "@_value": tjmoFeature["@_index"],
    });

    const fdarray = ttx.getFDArray();
    const fdSelectIndex = 0;
    const fontDict = fdarray[fdSelectIndex];
    const defaultWidth = parseInt(fontDict.Private[0].defaultWidthX[0]['@_value']);
    const nominalWidth = parseInt(fontDict.Private[0].nominalWidthX[0]['@_value']);

    const substitutions: Map<string, Array<string>> = new Map();

    // Add ligatures for precomposed glyphs
    const ligatureSubstLookup = {
        "@_index": gsub.LookupList[0].Lookup.length.toFixed(0),
        LookupType: [{ "@_value": "4" }],
        LookupFlag: [{ "@_value": "0" }],
        LigatureSubst: [{
            "@_index": "0",
            LigatureSet: [] as {
                '@_glyph': string,
                'Ligature': {
                    '@_components': string,
                    '@_glyph': string,
                }[],
            }[],
        }],
    };
    gsub.LookupList[0].Lookup.push(ligatureSubstLookup);

    for (const [first, ligatures] of getPuaLigatures().entries()) {
        const firstGlyphName = ttx.findGlyphName(first);
        if (firstGlyphName === undefined) {
            console.error(`Glyph for codepoint ${first} not found`);
            continue;
        }

        const ligatureList: {
            '@_components': string,
            '@_glyph': string,
        }[] = [];

        for (const lig of ligatures) {
            const rest = lig.rest.map((ch) => ttx.findGlyphName(ch));
            const pua = ttx.findGlyphName(lig.pua);
            if (rest.some((ch) => ch === undefined) || pua === undefined) {
                console.error(`Glyph for codepoint ${lig.pua} or its components not found`);
                continue;
            }
            ligatureList.push({
                '@_components': rest.join(','),
                '@_glyph': pua,
            });
        }

        if (ligatureList.length > 0) {
            ligatureSubstLookup.LigatureSubst[0].LigatureSet.push({
                '@_glyph': firstGlyphName,
                Ligature: ligatureList,
            });
        }
    }

    ccmpFeature.Feature[0].LookupListIndex.push({
        "@_index": ccmpFeature.Feature[0].LookupListIndex.length.toFixed(0),
        "@_value": ligatureSubstLookup["@_index"],
    });

    // Add contextual jamo glyph variants
    const sortedLayouts = curLayouts.toSorted((a, b) => a.substOrder - b.substOrder);
    for (const category of sortedLayouts) {
        for (const layout of category.layouts) {
            const focusIdx = layout.elems.findIndex(
                (kind) => kind.endsWith(layout.focus)
            );
            const prevGlyphs = layout.elems.slice(0, focusIdx)
                .map((kind) => getJamos(kind))
                .reverse();
            // FIXME: add precomposed glyphs for substitution context
            // e.g. 가 (U+AC00) + _ㆁㆁ_
            const nextGlyphs = layout.elems.slice(focusIdx + 1)
                .map((kind) => getJamos(kind));

            const inputCoverage = [];
            for (const ch of layout.glyphs.keys()) {
                const glyphName = ttx.findGlyphName(ch);
                if (glyphName !== undefined) {
                    inputCoverage.push({"@_value": glyphName});
                }
            }

            const backtrackCoverage: {
                '@_index': string,
                Glyph: { '@_value': string }[],
            }[] = [];
            prevGlyphs.forEach((glyphs, idx) => {
                const glyphNames: { '@_value': string }[] = [];
                for (const g of glyphs) {
                    const glyphName = ttx.findGlyphName(g);
                    if (glyphName !== undefined) {
                        glyphNames.push({"@_value": glyphName});
                        for (const sub of substitutions.get(glyphName) ?? []) {
                            glyphNames.push({"@_value": sub});
                        }
                    }
                }
                backtrackCoverage.push({
                    "@_index": idx.toFixed(0),
                    Glyph: glyphNames,
                });
            });

            const lookAheadCoverage: {
                '@_index': string,
                Glyph: { '@_value': string }[],
            }[] = [];
            nextGlyphs.forEach((glyphs, idx) => {
                const glyphNames: { '@_value': string }[] = [];
                for (const g of glyphs) {
                    const glyphName = ttx.findGlyphName(g);
                    if (glyphName !== undefined) {
                        glyphNames.push({"@_value": glyphName});
                    }
                }
                lookAheadCoverage.push({
                    "@_index": idx.toFixed(0),
                    Glyph: glyphNames,
                });
            });

            // Add lookups
            const singleSubstLookup = {
                "@_index": gsub.LookupList[0].Lookup.length.toFixed(0),
                LookupType: [{"@_value": "1"}],
                LookupFlag: [{"@_value": "0"}],
                SingleSubst: [{
                    Substitution: [] as {
                        '@_in': string,
                        '@_out': string,
                    }[],
                }],
            };
            gsub.LookupList[0].Lookup.push(singleSubstLookup);

            const chainSubstLookup = {
                "@_index": gsub.LookupList[0].Lookup.length.toFixed(0),
                LookupType: [{"@_value": "6"}],
                LookupFlag: [{"@_value": "0"}],
                ChainContextSubst: [{
                    "@_index": "0",
                    "@_Format": "3",  // use coverage tables
                    InputCoverage: [{
                        "@_index": "0",
                        Glyph: inputCoverage,
                    }],
                    BacktrackCoverage: backtrackCoverage,
                    LookAheadCoverage: lookAheadCoverage,
                    SubstLookupRecord: [{
                        "@_index": "0",
                        SequenceIndex: [{"@_value": "0"}],
                        LookupListIndex: [{
                            "@_value": singleSubstLookup["@_index"],
                        }],
                    }],
                }],
            };
            gsub.LookupList[0].Lookup.push(chainSubstLookup);

            if (layout.focus.endsWith('leading')) {
                ljmoFeature.Feature[0].LookupListIndex.push({
                    "@_index": ljmoFeature.Feature[0].LookupListIndex.length.toFixed(0),
                    "@_value": chainSubstLookup["@_index"],
                });
            } else if (layout.focus.endsWith('vowel')) {
                vjmoFeature.Feature[0].LookupListIndex.push({
                    "@_index": vjmoFeature.Feature[0].LookupListIndex.length.toFixed(0),
                    "@_value": chainSubstLookup["@_index"],
                });
            } else if (layout.focus.endsWith('trailing')) {
                tjmoFeature.Feature[0].LookupListIndex.push({
                    "@_index": tjmoFeature.Feature[0].LookupListIndex.length.toFixed(0),
                    "@_value": chainSubstLookup["@_index"],
                });
            }

            const bounds = getFocusGlyphBounds(layout, result);
            for (const [ch, glyph] of layout.glyphs.entries()) {
                if (glyph == null) {
                    continue;
                }
                const newGlyphId = "cid" + (++lastGlyphId).toFixed(0).padStart(5, '0');
                const width = lookAheadCoverage.length === 0 ? 1000 : 0;
                const charstring = makeCharstring(glyph, bounds, nominalWidth, width);

                const origGlyphId = ttx.findGlyphName(ch);
                if (!origGlyphId) {
                    throw new Error(`Glyph for codepoint ${ch} not found`);
                }
                singleSubstLookup.SingleSubst[0].Substitution.push({
                    '@_in': origGlyphId,
                    '@_out': newGlyphId,
                });
                substitutions.set(
                    origGlyphId,
                    substitutions.get(origGlyphId) ?? [],
                );
                substitutions.get(origGlyphId)?.push(newGlyphId);

                glyphOrder.push({
                    "@_id": "0",  // this is ignored by the parser
                    "@_name": newGlyphId,
                });

                charstrings.push({
                    '@_name': newGlyphId,
                    '@_fdSelectIndex': fdSelectIndex.toFixed(0),
                    '#text': charstring,
                });

                hmtx.push({
                    '@_name': newGlyphId,
                    '@_width': "1000",
                    '@_lsb': "0",
                });

                vmtx.push({
                    '@_name': newGlyphId,
                    '@_height': "1000",
                    '@_tsb': "0",
                });
            }
        }
    }

    return result.ttx;
}

const STANDARD_LEADINGS = [
    'ᄀ', 'ᄂ', 'ᄃ', 'ᄅ', 'ᄆ', 'ᄇ', 'ᄉ', 'ᄋ',
    'ᄌ', 'ᄎ', 'ᄏ', 'ᄐ', 'ᄑ', 'ᄒ',
    'ᄁ', 'ᄄ', 'ᄈ', 'ᄊ', 'ᄍ',
];
const STANDARD_VOWELS = [
    'ᅡ', 'ᅣ', 'ᅥ', 'ᅧ', 'ᅵ',
    'ᅢ', 'ᅤ', 'ᅦ', 'ᅨ',
    'ᅩ', 'ᅭ', 'ᅮ', 'ᅲ', 'ᅳ',
    'ᅪ', 'ᅬ', 'ᅯ', 'ᅱ', 'ᅴ',
    'ᅫ', 'ᅰ',
];
const STANDARD_TRAILINGS = [
    '', 'ᆨ', 'ᆫ', 'ᆮ', 'ᆯ', 'ᆷ', 'ᆸ', 'ᆺ', 'ᆼ',
    'ᆽ', 'ᆾ', 'ᆿ', 'ᇀ', 'ᇁ', 'ᇂ',
    'ᆩ', 'ᆪ', 'ᆬ', 'ᆭ', 'ᆰ', 'ᆱ', 'ᆲ', 'ᆳ',
    'ᆴ', 'ᆵ', 'ᆶ', 'ᆹ', 'ᆻ',
];
export function* standardSyllables(): Generator<{jamos: string, comp: string}> {
    for (const leading of STANDARD_LEADINGS) {
        for (const vowel of STANDARD_VOWELS) {
            for (const trailing of STANDARD_TRAILINGS) {
                let jamos = leading + vowel;
                const lIdx = leading.codePointAt(0)! - 'ᄀ'.codePointAt(0)!;
                const vIdx = vowel.codePointAt(0)! - 'ᅡ'.codePointAt(0)!;
                let tIdx = 0;
                if (trailing !== '') {
                    jamos = jamos + trailing;
                    tIdx = 1 + trailing.codePointAt(0)! - 'ᆨ'.codePointAt(0)!;
                }
                let codePoint = lIdx;
                codePoint = codePoint * STANDARD_VOWELS.length + vIdx;
                codePoint = codePoint * STANDARD_TRAILINGS.length + tIdx;
                codePoint += 0xAC00;
                yield {
                    jamos: jamos,
                    comp: String.fromCodePoint(codePoint),
                };
            }
        }
    }
}

let PUA_LIGATURES: Map<string, Array<{rest: Array<string>, pua: string}>> | null = null;
function getPuaLigatures(): Map<string, Array<{rest: Array<string>, pua: string}>> {
    if (PUA_LIGATURES === null) {
        PUA_LIGATURES = new Map();

        function addToMapEntry(uni: string, pua: string) {
            const key = uni[0];
            const rest = Array.from(uni).slice(1);
            if (!PUA_LIGATURES!.has(key)) {
                PUA_LIGATURES!.set(key, []);
            }
            PUA_LIGATURES!.get(key)?.push({
                rest: rest,
                pua: pua,
            });
        }

        // Convert longer sequences first
        for (let length = 3; length >= 2; --length) {
            for (const [pua, uni] of PUA_CONV_TAB.entries()) {
                if (uni.length === length) {
                    addToMapEntry(uni, pua);
                }
            }
            for (const {jamos, comp} of standardSyllables()) {
                if (jamos.length === length) {
                    addToMapEntry(jamos, comp);
                }
            }
        }
    }
    return PUA_LIGATURES;
}

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
                        top: divider.y + bounds.top * (1 - divider.y),
                        bottom: divider.y + bounds.bottom * (1 - divider.y),
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
    const ascender = parseInt(os2.sTypoAscender[0]['@_value']);
    const descender = parseInt(os2.sTypoDescender[0]['@_value']);
    const height = ascender - descender;

    const bounds = getBounds(layout.dividers) as Bounds;

    return {
        left: bounds.left * 1000,
        right: bounds.right * 1000,
        top: descender + bounds.top * height,
        bottom: descender + bounds.bottom * height,
    };
}
