import {Glyph} from "@/app/parse_glyph";
import {Bounds} from "@/app/font_utils";
import {getJamos} from "@/app/jamos";

export type JamoKind = (
    'leading' | 'leading-1' | 'leading-2'
    | 'right-vowel'
    | 'bottom-vowel' | 'bottom-vowel-1' | 'bottom-vowel-2'
    | 'mixed-vowel'
    | 'mixed-vowel-1' | 'mixed-vowel-2'
    | 'trailing'
);
export type JamoSubkind = (
    'single-leading' | 'single-leading-1' | 'single-leading-2'
    | 'stacked-leading' | 'stacked-leading-1' | 'stacked-leading-2'
    | 'double-leading' | 'double-leading-1' | 'double-leading-2'
    | 'triple-leading' | 'triple-leading-1' | 'triple-leading-2'
    | 'single-right-vowel' | 'double-right-vowel'
    | 'single-bottom-vowel' | 'bottom-vowel-1' | 'bottom-vowel-2'
    | 'double-bottom-vowel'
    | 'single-mixed-vowel' | 'double-mixed-vowel'
    | 'mixed-vowel-1' | 'mixed-vowel-2'
    | 'single-trailing' | 'stacked-trailing' | 'double-trailing' | 'triple-trailing'
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
    elems: Array<JamoKind | JamoSubkind>;
    dividers: Divider,
    glyphs: Map<string, ResizedGlyph>,
};

export type Category = {
    categoryName: string,
    tag: string,
    substOrder: number,  // lower is earlier
    focus: JamoSubkind,
    layouts: Layout[];
};

export type Layouts = Category[];

export type InitialLayout = {
    name: string,
    focus: JamoKind,
    elems: Array<JamoKind | JamoSubkind>;
    dividers: Divider,
};

export type InitialCategory = {
    categoryName: string,
    tag: string,
    substOrder: number,  // lower is earlier
    focus: JamoSubkind,
    layouts: InitialLayout[];
};

export type InitialLayouts = InitialCategory[];

export const jamoLayouts: InitialLayouts = [
    // Leading
    {
        categoryName: "초성 (기본자)",
        tag: 'no-trailing',
        substOrder: 10,
        focus: 'single-leading',
        layouts: [
            {
                name: '초성 (기본자) 가로모임',
                focus: 'leading',
                elems: ['single-leading', 'right-vowel'],
                dividers: {
                    type: 'vertical',
                    x: 0.6,
                    left: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
                    right: {type: 'jamo', kind: 'right-vowel'},
                },
            },
            {
                name: '초성 (기본자) 세로모임1',
                focus: 'leading',
                elems: ['single-leading', 'bottom-vowel-1'],
                dividers: {
                    type: 'horizontal',
                    y: 0.5,
                    top: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel-1'},
                },
            },
            {
                name: '초성 (기본자) 세로모임2',
                focus: 'leading',
                elems: ['single-leading', 'bottom-vowel-2'],
                dividers: {
                    type: 'horizontal',
                    y: 0.5,
                    top: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel-2'},
                },
            },
            {
                name: '초성 (기본자) 섞임모임1',
                focus: 'leading',
                elems: ['single-leading', 'mixed-vowel-1'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
                    rest: {type: 'jamo', kind: 'mixed-vowel-1'},
                },
            },
            {
                name: '초성 (기본자) 섞임모임2',
                focus: 'leading',
                elems: ['single-leading', 'mixed-vowel-2'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
                    rest: {type: 'jamo', kind: 'mixed-vowel-2'},
                },
            },
        ]
    },
    {
        categoryName: "초성 (연서자)",
        tag: 'no-trailing',
        substOrder: 10,
        focus: 'stacked-leading',
        layouts: [
            {
                name: '초성 (연서자) 가로모임',
                focus: 'leading',
                elems: ['stacked-leading', 'right-vowel'],
                dividers: {
                    type: 'vertical',
                    x: 0.6,
                    left: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
                    right: {type: 'jamo', kind: 'right-vowel'},
                },
            },
            {
                name: '초성 (연서자) 세로모임',
                focus: 'leading',
                elems: ['stacked-leading', 'bottom-vowel'],
                dividers: {
                    type: 'horizontal',
                    y: 0.3,
                    top: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel'},
                },
            },
            {
                name: '초성 (연서자) 섞임모임',
                focus: 'leading',
                elems: ['stacked-leading', 'mixed-vowel'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
                    rest: {type: 'jamo', kind: 'mixed-vowel'},
                },
            },
        ]
    },
    {
        categoryName: "초성 (2중 병서)",
        tag: 'no-trailing',
        substOrder: 10,
        focus: 'double-leading',
        layouts: [
            {
                name: '초성 (2중) 가로모임',
                focus: 'leading',
                elems: ['double-leading', 'right-vowel'],
                dividers: {
                    type: 'vertical',
                    x: 0.6,
                    left: {type: 'jamo', kind: 'leading', subkind: 'double-leading'},
                    right: {type: 'jamo', kind: 'right-vowel'},
                },
            },
            {
                name: '초성 (2중) 세로모임',
                focus: 'leading',
                elems: ['double-leading', 'bottom-vowel'],
                dividers: {
                    type: 'horizontal',
                    y: 0.5,
                    top: {type: 'jamo', kind: 'leading', subkind: 'double-leading'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel'},
                },
            },
            {
                name: '초성 (2중) 섞임모임',
                focus: 'leading',
                elems: ['double-leading', 'mixed-vowel'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading', subkind: 'double-leading'},
                    rest: {type: 'jamo', kind: 'mixed-vowel'},
                },
            },
        ]
    },
    {
        categoryName: "초성 (3중 병서)",
        tag: 'no-trailing',
        substOrder: 10,
        focus: 'triple-leading',
        layouts: [
            {
                name: '초성 (3중) 가로모임',
                focus: 'leading',
                elems: ['triple-leading', 'right-vowel'],
                dividers: {
                    type: 'vertical',
                    x: 0.6,
                    left: {type: 'jamo', kind: 'leading', subkind: 'triple-leading'},
                    right: {type: 'jamo', kind: 'right-vowel'},
                },
            },
            {
                name: '초성 (3중) 세로모임',
                focus: 'leading',
                elems: ['triple-leading', 'bottom-vowel'],
                dividers: {
                    type: 'horizontal',
                    y: 0.5,
                    top: {type: 'jamo', kind: 'leading', subkind: 'triple-leading'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel'},
                },
            },
            {
                name: '초성 (3중) 섞임모임',
                focus: 'leading',
                elems: ['triple-leading', 'mixed-vowel'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading', subkind: 'triple-leading'},
                    rest: {type: 'jamo', kind: 'mixed-vowel'},
                },
            },
        ]
    },
    // Vowels
    {
        categoryName: "중성 (기본자)",
        tag: 'no-trailing',
        substOrder: 10,
        focus: 'single-right-vowel',
        layouts: [
            {
                name: '중성 (기본자) 가로모임',
                focus: 'right-vowel',
                elems: ['leading', 'single-right-vowel'],
                dividers: {
                    type: 'vertical',
                    x: 0.6,
                    left: {type: 'jamo', kind: 'leading'},
                    right: {type: 'jamo', kind: 'right-vowel', subkind: 'single-right-vowel'},
                },
            },
            {
                name: '중성 (기본자) 세로모임1',
                focus: 'bottom-vowel',
                elems: ['leading-1', 'single-bottom-vowel'],
                dividers: {
                    type: 'horizontal',
                    y: 0.5,
                    top: {type: 'jamo', kind: 'leading-1'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'single-bottom-vowel'},
                },
            },
            {
                name: '중성 (기본자) 세로모임2',
                focus: 'bottom-vowel',
                elems: ['leading-2', 'single-bottom-vowel'],
                dividers: {
                    type: 'horizontal',
                    y: 0.5,
                    top: {type: 'jamo', kind: 'leading-2'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'single-bottom-vowel'},
                },
            },
            {
                name: '중성 (기본자) 섞임모임1',
                focus: 'mixed-vowel',
                elems: ['leading-1', 'single-mixed-vowel'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading-1'},
                    rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'single-mixed-vowel'},
                },
            },
            {
                name: '중성 (기본자) 섞임모임2',
                focus: 'mixed-vowel',
                elems: ['leading-2', 'single-mixed-vowel'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading-2'},
                    rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'single-mixed-vowel'},
                },
            },
        ]
    },
    {
        categoryName: "중성 (중첩자)",
        tag: 'no-trailing',
        substOrder: 10,
        focus: 'double-right-vowel',
        layouts: [
            {
                name: '중성 (중첩자) 가로모임',
                focus: 'right-vowel',
                elems: ['leading', 'double-right-vowel'],
                dividers: {
                    type: 'vertical',
                    x: 0.6,
                    left: {type: 'jamo', kind: 'leading'},
                    right: {type: 'jamo', kind: 'right-vowel', subkind: 'double-right-vowel'},
                },
            },
            {
                name: '중성 (중첩자) 세로모임1',
                focus: 'bottom-vowel',
                elems: ['leading-1', 'double-bottom-vowel'],
                dividers: {
                    type: 'horizontal',
                    y: 0.6,
                    top: {type: 'jamo', kind: 'leading-1'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'double-bottom-vowel'},
                },
            },
            {
                name: '중성 (중첩자) 세로모임2',
                focus: 'bottom-vowel',
                elems: ['leading-2', 'double-bottom-vowel'],
                dividers: {
                    type: 'horizontal',
                    y: 0.5,
                    top: {type: 'jamo', kind: 'leading-2'},
                    bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'double-bottom-vowel'},
                },
            },
            {
                name: '중성 (중첩자) 섞임모임1',
                focus: 'mixed-vowel',
                elems: ['leading-1', 'double-mixed-vowel'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading-1'},
                    rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'double-mixed-vowel'},
                },
            },
            {
                name: '중성 (중첩자) 섞임모임2',
                focus: 'mixed-vowel',
                elems: ['leading-2', 'double-mixed-vowel'],
                dividers: {
                    type: 'mixed',
                    x: 0.6,
                    y: 0.5,
                    topLeft: {type: 'jamo', kind: 'leading-2'},
                    rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'double-mixed-vowel'},
                },
            },
        ]
    },
    // Leading (with trailing)
    {
        categoryName: "받침있는 초성 (기본자)",
        tag: 'with-trailing',
        substOrder: 5,
        focus: 'single-leading',
        layouts: [
            {
                name: '초성 (기본자) 가로모임',
                focus: 'leading',
                elems: ['single-leading', 'right-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
                        right: {type: 'jamo', kind: 'right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '초성 (기본자) 세로모임',
                focus: 'leading',
                elems: ['single-leading', 'bottom-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.4,
                        top: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '초성 (기본자) 섞임모임',
                focus: 'leading',
                elems: ['single-leading', 'mixed-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading', subkind: 'single-leading'},
                        rest: {type: 'jamo', kind: 'mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
        ],
    },
    {
        categoryName: "받침있는 초성 (연서자)",
        tag: 'with-trailing',
        substOrder: 5,
        focus: 'stacked-leading',
        layouts: [
            {
                name: '초성 (연서자) 가로모임',
                focus: 'leading',
                elems: ['stacked-leading', 'right-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
                        right: {type: 'jamo', kind: 'right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '초성 (연서자) 세로모임',
                focus: 'leading',
                elems: ['stacked-leading', 'bottom-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.3,
                        top: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '초성 (연서자) 섞임모임',
                focus: 'leading',
                elems: ['stacked-leading', 'mixed-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.5,
                        topLeft: {type: 'jamo', kind: 'leading', subkind: 'stacked-leading'},
                        rest: {type: 'jamo', kind: 'mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
        ]
    },
    {
        categoryName: "받침있는 초성 (2중 병서)",
        tag: 'with-trailing',
        substOrder: 5,
        focus: 'double-leading',
        layouts: [
            {
                name: '초성 (2중) 가로모임',
                focus: 'leading',
                elems: ['double-leading', 'right-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading', subkind: 'double-leading'},
                        right: {type: 'jamo', kind: 'right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '초성 (2중) 세로모임',
                focus: 'leading',
                elems: ['double-leading', 'bottom-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.5,
                        top: {type: 'jamo', kind: 'leading', subkind: 'double-leading'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '초성 (2중) 섞임모임',
                focus: 'leading',
                elems: ['double-leading', 'mixed-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.5,
                        topLeft: {type: 'jamo', kind: 'leading', subkind: 'double-leading'},
                        rest: {type: 'jamo', kind: 'mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
        ]
    },
    {
        categoryName: "받침있는 초성 (3중 병서)",
        tag: 'with-trailing',
        substOrder: 5,
        focus: 'triple-leading',
        layouts: [
            {
                name: '초성 (3중) 가로모임',
                focus: 'leading',
                elems: ['triple-leading', 'right-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading', subkind: 'triple-leading'},
                        right: {type: 'jamo', kind: 'right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '초성 (3중) 세로모임',
                focus: 'leading',
                elems: ['triple-leading', 'bottom-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.5,
                        top: {type: 'jamo', kind: 'leading', subkind: 'triple-leading'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '초성 (3중) 섞임모임',
                focus: 'leading',
                elems: ['triple-leading', 'mixed-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.5,
                        topLeft: {type: 'jamo', kind: 'leading', subkind: 'triple-leading'},
                        rest: {type: 'jamo', kind: 'mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
        ]
    },
    // Vowels (with trailing)
    {
        categoryName: "받침있는 중성 (기본자)",
        tag: 'with-trailing',
        substOrder: 5,
        focus: 'single-right-vowel',
        layouts: [
            {
                name: '중성 (기본자) 가로모임',
                focus: 'right-vowel',
                elems: ['leading', 'single-right-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading'},
                        right: {type: 'jamo', kind: 'right-vowel', subkind: 'single-right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '중성 (기본자) 세로모임1',
                focus: 'bottom-vowel',
                elems: ['leading-1', 'single-bottom-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.5,
                        top: {type: 'jamo', kind: 'leading-1'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'single-bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '중성 (기본자) 세로모임2',
                focus: 'bottom-vowel',
                elems: ['leading-2', 'single-bottom-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.5,
                        top: {type: 'jamo', kind: 'leading-2'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'single-bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '중성 (기본자) 섞임모임1',
                focus: 'mixed-vowel',
                elems: ['leading-1', 'single-mixed-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading-1'},
                        rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'single-mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '중성 (기본자) 섞임모임2',
                focus: 'mixed-vowel',
                elems: ['leading-2', 'single-mixed-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading-2'},
                        rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'single-mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
        ]
    },
    {
        categoryName: "받침있는 중성 (중첩자)",
        tag: 'with-trailing',
        substOrder: 5,
        focus: 'double-right-vowel',
        layouts: [
            {
                name: '중성 (중첩자) 가로모임',
                focus: 'right-vowel',
                elems: ['leading', 'double-right-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading'},
                        right: {type: 'jamo', kind: 'right-vowel', subkind: 'double-right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '중성 (중첩자) 세로모임1',
                focus: 'bottom-vowel',
                elems: ['leading-1', 'double-bottom-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.5,
                        top: {type: 'jamo', kind: 'leading-1'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'double-bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '중성 (중첩자) 세로모임2',
                focus: 'bottom-vowel',
                elems: ['leading-2', 'double-bottom-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.5,
                        top: {type: 'jamo', kind: 'leading-2'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel', subkind: 'double-bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '중성 (중첩자) 섞임모임1',
                focus: 'mixed-vowel',
                elems: ['leading-1', 'double-mixed-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading-1'},
                        rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'double-mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
            {
                name: '중성 (중첩자) 섞임모임2',
                focus: 'mixed-vowel',
                elems: ['leading-2', 'double-mixed-vowel', 'trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading-2'},
                        rest: {type: 'jamo', kind: 'mixed-vowel', subkind: 'double-mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing'},
                },
            },
        ]
    },
    // Tail
    {
        categoryName: "받침 (기본자)",
        tag: 'with-trailing',
        substOrder: 10,
        focus: 'single-trailing',
        layouts: [
            {
                name: '받침 (기본자) 가로모임',
                focus: 'trailing',
                elems: ['leading', 'right-vowel', 'single-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading'},
                        right: {type: 'jamo', kind: 'right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'single-trailing'},
                },
            },
            {
                name: '받침 (기본자) 세로모임',
                focus: 'trailing',
                elems: ['leading', 'bottom-vowel', 'single-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.4,
                        top: {type: 'jamo', kind: 'leading'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'single-trailing'},
                },
            },
            {
                name: '받침 (기본자) 섞임모임',
                focus: 'trailing',
                elems: ['leading', 'mixed-vowel', 'single-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading'},
                        rest: {type: 'jamo', kind: 'mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'single-trailing'},
                },
            },
        ]
    },
    {
        categoryName: "받침 (연서자)",
        tag: 'with-trailing',
        substOrder: 10,
        focus: 'stacked-trailing',
        layouts: [
            {
                name: '받침 (연서자) 가로모임',
                focus: 'trailing',
                elems: ['leading', 'right-vowel', 'stacked-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading'},
                        right: {type: 'jamo', kind: 'right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'stacked-trailing'},
                },
            },
            {
                name: '받침 (연서자) 세로모임',
                focus: 'trailing',
                elems: ['leading', 'bottom-vowel', 'stacked-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.4,
                        top: {type: 'jamo', kind: 'leading'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'stacked-trailing'},
                },
            },
            {
                name: '받침 (연서자) 섞임모임',
                focus: 'trailing',
                elems: ['leading', 'mixed-vowel', 'stacked-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading'},
                        rest: {type: 'jamo', kind: 'mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'stacked-trailing'},
                },
            },
        ]
    },
    {
        categoryName: "받침 (2중 병서)",
        tag: 'with-trailing',
        substOrder: 10,
        focus: 'double-trailing',
        layouts: [
            {
                name: '받침 (2중 병서) 가로모임',
                focus: 'trailing',
                elems: ['leading', 'right-vowel', 'double-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading'},
                        right: {type: 'jamo', kind: 'right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'double-trailing'},
                },
            },
            {
                name: '받침 (2중 병서) 세로모임',
                focus: 'trailing',
                elems: ['leading', 'bottom-vowel', 'double-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.4,
                        top: {type: 'jamo', kind: 'leading'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'double-trailing'},
                },
            },
            {
                name: '받침 (2중 병서) 섞임모임',
                focus: 'trailing',
                elems: ['leading', 'mixed-vowel', 'double-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading'},
                        rest: {type: 'jamo', kind: 'mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'double-trailing'},
                },
            },
        ]
    },
    {
        categoryName: "받침 (3중 병서)",
        tag: 'with-trailing',
        substOrder: 10,
        focus: 'triple-trailing',
        layouts: [
            {
                name: '받침 (3중 병서) 가로모임',
                focus: 'trailing',
                elems: ['leading', 'right-vowel', 'triple-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'vertical',
                        x: 0.6,
                        left: {type: 'jamo', kind: 'leading'},
                        right: {type: 'jamo', kind: 'right-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'triple-trailing'},
                },
            },
            {
                name: '받침 (3중 병서) 세로모임',
                focus: 'trailing',
                elems: ['leading', 'bottom-vowel', 'triple-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'horizontal',
                        y: 0.4,
                        top: {type: 'jamo', kind: 'leading'},
                        bottom: {type: 'jamo', kind: 'bottom-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'triple-trailing'},
                },
            },
            {
                name: '받침 (3중 병서) 섞임모임',
                focus: 'trailing',
                elems: ['leading', 'mixed-vowel', 'triple-trailing'],
                dividers: {
                    type: 'horizontal',
                    y: 0.4,
                    top: {
                        type: 'mixed',
                        x: 0.6,
                        y: 0.4,
                        topLeft: {type: 'jamo', kind: 'leading'},
                        rest: {type: 'jamo', kind: 'mixed-vowel'},
                    },
                    bottom: {type: 'jamo', kind: 'trailing', subkind: 'triple-trailing'},
                },
            },
        ]
    },
];
