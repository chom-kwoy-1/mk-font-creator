import {ChainContextSubst, TTXWrapper} from "@/app/font_utils/TTXObject";
import {Divider, JamoElement, Layout, Layouts} from "@/app/font_utils/jamo_layouts";
import {makeCharstring} from "@/app/font_utils/make_glyph";
import {Bounds} from "@/app/font_utils/font_utils";
import {getJamos, trailingJamos, subkindOf} from "@/app/font_utils/jamos";
import {PUA_CONV_TAB} from "@/app/font_utils/pua_uni_table";

export type OrientationMode = 'horz-and-vert' | 'vert-only';
export function generateTtx(
    ttx: TTXWrapper,
    curLayouts: Layouts,
    orientationMode: OrientationMode,
) {
    const result = new TTXWrapper(structuredClone(ttx.ttx));

    const os2 = result.getOS2();
    const glyphOrder = result.getGlyphOrder();
    const cff = result.getCFF();
    const charstrings = result.getCharstrings();
    const gsub = result.getGsub();
    const hmtx = result.getHmtx();
    const vmtx = result.getVmtx();

    const fdarray = ttx.getFDArray();
    const fdSelectIndex = 0;
    const fontDict = fdarray[fdSelectIndex];
    const defaultWidth = parseInt(fontDict.Private[0].defaultWidthX[0]['@_value']);
    const nominalWidth = parseInt(fontDict.Private[0].nominalWidthX[0]['@_value']);

    // Set bit for Hangul jamo
    const range1 = os2.ulUnicodeRange1[0]['@_value'];
    os2.ulUnicodeRange1[0]['@_value'] = (
        range1.slice(0, 3) + '1' + range1.slice(4)
    );

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
    };
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

    const substitutions: Map<string, Array<string>> = new Map();

    // Add 3-jamo ligatures
    const ligatureSubstLookup3 = {
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
    gsub.LookupList[0].Lookup.push(ligatureSubstLookup3);

    for (const [first, ligatures] of precomposedLigatures(3).entries()) {
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
            const composed = ttx.findGlyphName(lig.composed);
            if (rest.some((ch) => ch === undefined) || composed === undefined) {
                console.error(`Glyph for codepoint ${lig.composed} or its components not found`);
                continue;
            }
            ligatureList.push({
                '@_components': rest.join(','),
                '@_glyph': composed,
            });
        }

        if (ligatureList.length > 0) {
            ligatureSubstLookup3.LigatureSubst[0].LigatureSet.push({
                '@_glyph': firstGlyphName,
                Ligature: ligatureList,
            });
        }
    }

    ccmpFeature.Feature[0].LookupListIndex.push({
        "@_index": ccmpFeature.Feature[0].LookupListIndex.length.toFixed(0),
        "@_value": ligatureSubstLookup3["@_index"],
    });

    // Add ligatures for 2-jamo precomposed glyphs
    const chainSubstLookup = {
        "@_index": gsub.LookupList[0].Lookup.length.toFixed(0),
        LookupType: [{ "@_value": "6" }],
        LookupFlag: [{ "@_value": "0" }],
        ChainContextSubst: [] as ChainContextSubst[],
    };
    gsub.LookupList[0].Lookup.push(chainSubstLookup);

    const ligatureSubstLookup2 = {
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
    gsub.LookupList[0].Lookup.push(ligatureSubstLookup2);

    const trailingJamoNames = new Set(
        trailingJamos()
            .values()
            .map((jamo) => ttx.findGlyphName(jamo))
            .filter((jamo) => jamo !== undefined)
            .toArray()
    );

    // Skip composition if trailing jamo is present
    for (const [first, ligatures] of precomposedLigatures(2).entries()) {
        const firstGlyphName = ttx.findGlyphName(first);
        if (firstGlyphName === undefined) {
            console.error(`Glyph for codepoint ${first} not found`);
            continue;
        }

        for (const lig of ligatures) {
            const rest = ttx.findGlyphName(lig.rest[0]);
            if (rest === undefined) {
                console.error(`Glyph for codepoint ${lig.rest[0]} not found`);
                continue;
            }

            chainSubstLookup.ChainContextSubst.push({
                "@_index": chainSubstLookup.ChainContextSubst.length.toFixed(0),
                "@_Format": "3",  // use coverage tables
                InputCoverage: [
                    { "@_index": "0", Glyph: [{ "@_value": firstGlyphName }]},
                    { "@_index": "1", Glyph: [{ "@_value": rest }] }
                ],
                BacktrackCoverage: [],
                LookAheadCoverage: [{
                    "@_index": "0",
                    Glyph: (
                        trailingJamoNames
                        .values()
                        .map((jamo) => ({ "@_value": jamo }))
                        .toArray()
                    )
                }],
                SubstLookupRecord: [],
            });
        }
    }

    for (const [first, ligatures] of precomposedLigatures(2).entries()) {
        const firstGlyphName = ttx.findGlyphName(first);
        if (firstGlyphName === undefined) {
            continue;
        }

        const ligatureList: {
            '@_components': string,
            '@_glyph': string,
        }[] = [];

        for (const lig of ligatures) {
            const rest = ttx.findGlyphName(lig.rest[0]);
            const composed = ttx.findGlyphName(lig.composed);
            if (rest === undefined) {
                continue;
            }
            if (composed === undefined) {
                console.error(`Glyph for codepoint ${lig.composed} not found`);
                continue;
            }

            chainSubstLookup.ChainContextSubst.push({
                "@_index": chainSubstLookup.ChainContextSubst.length.toFixed(0),
                "@_Format": "3",  // use coverage tables
                InputCoverage: [
                    { "@_index": "0", Glyph: [{ "@_value": firstGlyphName }]},
                    { "@_index": "1", Glyph: [{ "@_value": rest }] }
                ],
                BacktrackCoverage: [],
                LookAheadCoverage: [],
                SubstLookupRecord: [{
                    "@_index": "0",
                    SequenceIndex: [{"@_value": "0"}],
                    LookupListIndex: [{
                        "@_value": ligatureSubstLookup2["@_index"],
                    }],
                }],
            });

            ligatureList.push({
                '@_components': rest,
                '@_glyph': composed,
            })
        }

        if (ligatureList.length > 0) {
            ligatureSubstLookup2.LigatureSubst[0].LigatureSet.push({
                '@_glyph': firstGlyphName,
                Ligature: ligatureList,
            });
        }
    }

    ccmpFeature.Feature[0].LookupListIndex.push({
        "@_index": ccmpFeature.Feature[0].LookupListIndex.length.toFixed(0),
        "@_value": chainSubstLookup["@_index"],
    });

    // Add contextual jamo glyph variants
    function substOrder(layout: Layout) {
        return layout.tag === 'with-trailing'? 5 : 10;
    }
    const sortedLayouts = curLayouts
        .flatMap((category) => category.layouts)
        .toSorted((a, b) => substOrder(a) - substOrder(b));
    for (const layout of sortedLayouts) {
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
            const orientation = orientationMode === 'horz-and-vert' ? 'horz' : 'vert';
            const newGlyphId = "cid" + (++lastGlyphId).toFixed(0).padStart(5, '0');
            const isLeading = subkindOf(ch).values().some((subkind) => subkind.endsWith('leading'));
            const width = (isLeading || orientation === 'vert') ? 1000 : 0;
            const height = isLeading ? 1000 : 0;
            const offset = isLeading ? 0 : -1000;
            const xOffset = orientation === 'horz' ? offset : 0;
            const yOffset = orientation === 'vert' ? -offset : 0;

            const charstring = makeCharstring(glyph, bounds, nominalWidth, width, xOffset, yOffset);

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
                '@_width': width.toFixed(0),
                '@_lsb': "0",
            });

            vmtx.push({
                '@_name': newGlyphId,
                '@_height': height.toFixed(0),
                '@_tsb': "0",
            });

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
        }
    }

    // Update CID count in CFF
    cff.CFFFont[0].CIDCount[0]['@_value'] = (lastGlyphId + 1).toFixed(0);

    // TODO: add GPOS for adjusting glyph positions for horz-and-vert mode

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

function precomposedLigatures(length: number): Map<string, Array<{rest: Array<string>, composed: string}>> {
    const PUA_LIGATURES = new Map();

    function addToMapEntry(uni: string, pua: string) {
        const key = uni[0];
        const rest = Array.from(uni).slice(1);
        if (!PUA_LIGATURES!.has(key)) {
            PUA_LIGATURES!.set(key, []);
        }
        PUA_LIGATURES!.get(key)?.push({
            rest: rest,
            composed: pua,
        });
    }

    // Convert longer sequences first
    for (const [pua, uni] of PUA_CONV_TAB.entries()) {
        if (uni.length === length) {
            addToMapEntry(uni, pua);
        }
    }
    // FIXME: is this needed?
    // for (const {jamos, comp} of standardSyllables()) {
    //     if (jamos.length === length) {
    //         addToMapEntry(jamos, comp);
    //     }
    // }
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
