import {Glyph} from "@/app/parse_glyph";
import {
    singleLeadingJamos,
    stackedLeadingJamos,
} from "@/app/jamos";

export type JamoElement = {
    type: 'jamo',
    kind: 'single-leading' | 'stacked-leading' | 'right-vowel' | 'bottom-vowel' | 'mixed-vowel',
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

type ResizedGlyph = {
    glyph: Glyph,
    left: number,
    right: number,
    top: number,
    bottom: number,
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
        focus: 'single-leading',
        dividers: {
            type: 'vertical',
            x: 0.7,
            left: {type: 'jamo', kind: 'single-leading'},
            right: {type: 'jamo', kind: 'right-vowel'},
        },
        glyphs: new Map(singleLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 세로모임',
        focus: 'single-leading',
        dividers: {
            type: 'horizontal',
            y: 0.5,
            top: {type: 'jamo', kind: 'single-leading'},
            bottom: {type: 'jamo', kind: 'bottom-vowel'},
        },
        glyphs: new Map(singleLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 기본자, 섞임모임',
        focus: 'single-leading',
        dividers: {
            type: 'mixed',
            x: 0.7,
            y: 0.5,
            topLeft: {type: 'jamo', kind: 'single-leading'},
            rest: {type: 'jamo', kind: 'mixed-vowel'},
        },
        glyphs: new Map(singleLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 가로모임',
        focus: 'stacked-leading',
        dividers: {
            type: 'vertical',
            x: 0.7,
            left: {type: 'jamo', kind: 'stacked-leading'},
            right: {type: 'jamo', kind: 'right-vowel'},
        },
        glyphs: new Map(stackedLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 세로모임',
        focus: 'stacked-leading',
        dividers: {
            type: 'horizontal',
            y: 0.5,
            top: {type: 'jamo', kind: 'stacked-leading'},
            bottom: {type: 'jamo', kind: 'bottom-vowel'},
        },
        glyphs: new Map(stackedLeadingJamos.map(jamo => [jamo, null])),
    },
    {
        name: 'LV, 연서자, 섞임모임',
        focus: 'stacked-leading',
        dividers: {
            type: 'mixed',
            x: 0.7,
            y: 0.5,
            topLeft: {type: 'jamo', kind: 'stacked-leading'},
            rest: {type: 'jamo', kind: 'mixed-vowel'},
        },
        glyphs: new Map(stackedLeadingJamos.map(jamo => [jamo, null])),
    },
];
