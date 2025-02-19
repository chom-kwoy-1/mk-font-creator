import {Glyph} from "@/app/parse_glyph";
import {
    singleLeadingJamos,
    stackedLeadingJamos,
    doubleLeadingJamos,
    tripleLeadingJamos,
    singleRightVowelJamos,
    doubleRightVowelJamos,
    singleBottomVowelJamos,
    doubleBottomVowelJamos,
    singleMixedVowelJamos,
    doubleMixedVowelJamos,
    singleTailingJamos,
    stackedTailingJamos,
    doubleTailingJamos,
    tripleTailingJamos,
} from "@/app/jamos";
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
    focus: string,
    dividers: Divider,
    glyphs: Map<string, ResizedGlyph | null>,
};

export const leadingLayouts: Layout[] = [
    {
        name: 'LV, 기본자, 가로모임',
        focus: 'leading',
        dividers: {
            type: 'vertical',
            x: 0.7,
            left: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
            right: {type: 'jamo', kind: 'right-vowel'},
        },
        glyphs: new Map(singleLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 세로모임',
        focus: 'leading',
        dividers: {
            type: 'horizontal',
            y: 0.5,
            top: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
            bottom: {type: 'jamo', kind: 'bottom-vowel'},
        },
        glyphs: new Map(singleLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 섞임모임',
        focus: 'leading',
        dividers: {
            type: 'mixed',
            x: 0.7,
            y: 0.5,
            topLeft: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
            rest: {type: 'jamo', kind: 'mixed-vowel'},
        },
        glyphs: new Map(singleLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 가로모임',
        focus: 'leading',
        dividers: {
            type: 'vertical',
            x: 0.7,
            left: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
            right: {type: 'jamo', kind: 'right-vowel'},
        },
        glyphs: new Map(stackedLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 세로모임',
        focus: 'leading',
        dividers: {
            type: 'horizontal',
            y: 0.5,
            top: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
            bottom: {type: 'jamo', kind: 'bottom-vowel'},
        },
        glyphs: new Map(stackedLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 섞임모임',
        focus: 'leading',
        dividers: {
            type: 'mixed',
            x: 0.7,
            y: 0.5,
            topLeft: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
            rest: {type: 'jamo', kind: 'mixed-vowel'},
        },
        glyphs: new Map(stackedLeadingJamos.map(jamo => [jamo, null])),
    },
];

export const vowelLayouts: Layout[] = [
    {
        name: 'LV, 기본자, 가로모임',
        focus: 'right-vowel',
        dividers: {
            type: 'vertical',
            x: 0.7,
            left: {type: 'jamo', kind: 'leading'},
            right: {type: 'jamo', kind: 'right-vowel', subkind: 'single-right-vowel'},
        },
        glyphs: new Map(singleRightVowelJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 세로모임',
        focus: 'bottom-vowel',
        dividers: {
            type: 'horizontal',
            y: 0.5,
            top: {type: 'jamo', kind: 'leading'},
            bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'single-bottom-vowel'},
        },
        glyphs: new Map(singleBottomVowelJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 섞임모임',
        focus: 'mixed-vowel',
        dividers: {
            type: 'mixed',
            x: 0.7,
            y: 0.5,
            topLeft: {type: 'jamo', kind: 'leading'},
            rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'single-mixed-vowel'},
        },
        glyphs: new Map(singleMixedVowelJamos.map(jamo => [jamo, null])),
    },
];
