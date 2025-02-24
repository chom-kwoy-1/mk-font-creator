import {Glyph} from "@/app/parse_glyph";
import {jamoTable} from "@/app/jamos";
import {Bounds} from "@/app/font_utils";

export type JamoKind = 'leading' | 'right-vowel' | 'bottom-vowel' | 'mixed-vowel' | 'tailing';
export type JamoSubkind = (
    'single-leading' | 'stacked-leading' | 'double-leading' | 'triple-leading'
    | 'single-right-vowel' | 'double-right-vowel'
    | 'single-bottom-vowel' | 'double-bottom-vowel'
    | 'single-mixed-vowel' | 'double-mixed-vowel'
    | 'single-tailing' | 'stacked-tailing' | 'double-tailing' | 'triple-tailing'
);

export type JamoElement = {
    type: 'jamo',
    kind: JamoKind,
    subkind?: JamoSubkind,
};

export type Divider = VerticalDivider | HorizontalDivider | MixedDivider;

type VerticalDivider = {
    type: 'vertical',
    x: number,
    left: JamoElement | Divider,
    right: JamoElement | Divider,
};

type HorizontalDivider = {
    type: 'horizontal',
    y: number,
    top: JamoElement | Divider,
    bottom: JamoElement | Divider,
};

type MixedDivider = {
    type: 'mixed',
    x: number,
    y: number,
    topLeft: JamoElement | Divider,
    rest: JamoElement | Divider,
};

export type ResizedGlyph = {
    glyph: Glyph,
    bounds: Bounds,
};

export type Layout = {
    name: string,
    focus: JamoKind,
    elems: Set<JamoKind | JamoSubkind>;
    dividers: Divider,
    glyphs: Map<string, ResizedGlyph | null>,
};

export const jamoLayouts: Layout[] = [
    // Consonants
    {
        name: 'LV, 기본자, 가로모임',
        focus: 'leading',
        elems: new Set(['single-leading', 'right-vowel']),
        dividers: {
            type: 'vertical',
            x: 0.6,
            left: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
            right: {type: 'jamo', kind: 'right-vowel'},
        },
        glyphs: new Map(jamoTable['single-leading'].map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 세로모임',
        focus: 'leading',
        elems: new Set(['single-leading', 'bottom-vowel']),
        dividers: {
            type: 'horizontal',
            y: 0.5,
            top: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
            bottom: {type: 'jamo', kind: 'bottom-vowel'},
        },
        glyphs: new Map(jamoTable['single-leading'].map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 섞임모임',
        focus: 'leading',
        elems: new Set(['single-leading', 'mixed-vowel']),
        dividers: {
            type: 'mixed',
            x: 0.6,
            y: 0.5,
            topLeft: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
            rest: {type: 'jamo', kind: 'mixed-vowel'},
        },
        glyphs: new Map(jamoTable['single-leading'].map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 가로모임',
        focus: 'leading',
        elems: new Set(['stacked-leading', 'right-vowel']),
        dividers: {
            type: 'vertical',
            x: 0.6,
            left: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
            right: {type: 'jamo', kind: 'right-vowel'},
        },
        glyphs: new Map(jamoTable['stacked-leading'].map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 세로모임',
        focus: 'leading',
        elems: new Set(['stacked-leading', 'bottom-vowel']),
        dividers: {
            type: 'horizontal',
            y: 0.3,
            top: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
            bottom: {type: 'jamo', kind: 'bottom-vowel'},
        },
        glyphs: new Map(jamoTable['stacked-leading'].map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 섞임모임',
        focus: 'leading',
        elems: new Set(['stacked-leading', 'mixed-vowel']),
        dividers: {
            type: 'mixed',
            x: 0.6,
            y: 0.5,
            topLeft: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
            rest: {type: 'jamo', kind: 'mixed-vowel'},
        },
        glyphs: new Map(jamoTable['stacked-leading'].map(jamo => [jamo, null])),
    },
    // Vowels
    {
        name: 'LV, 기본자, 가로모임',
        focus: 'right-vowel',
        elems: new Set(['leading', 'single-right-vowel']),
        dividers: {
            type: 'vertical',
            x: 0.6,
            left: {type: 'jamo', kind: 'leading'},
            right: {type: 'jamo', kind: 'right-vowel', subkind: 'single-right-vowel'},
        },
        glyphs: new Map(jamoTable['single-right-vowel'].map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 세로모임',
        focus: 'bottom-vowel',
        elems: new Set(['leading', 'single-bottom-vowel']),
        dividers: {
            type: 'horizontal',
            y: 0.5,
            top: {type: 'jamo', kind: 'leading'},
            bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'single-bottom-vowel'},
        },
        glyphs: new Map(jamoTable['single-bottom-vowel'].map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 섞임모임',
        focus: 'mixed-vowel',
        elems: new Set(['leading', 'single-mixed-vowel']),
        dividers: {
            type: 'mixed',
            x: 0.6,
            y: 0.5,
            topLeft: {type: 'jamo', kind: 'leading'},
            rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'single-mixed-vowel'},
        },
        glyphs: new Map(jamoTable['single-mixed-vowel'].map(jamo => [jamo, null])),
    },
];
