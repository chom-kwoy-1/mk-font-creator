import {JamoKind, JamoSubkind, Layout} from "@/app/jamo_layouts";

type JamoTable = {
    [key in JamoSubkind]: string[];
};

export const jamoTable: JamoTable = {
    'single-leading': [
        'ᄀ', 'ᄂ', 'ᄃ', 'ᄅ', 'ᄆ', 'ᄇ', 'ᄉ', 'ᄋ',
        'ᄌ', 'ᄎ', 'ᄏ', 'ᄐ', 'ᄑ', 'ᄒ', 'ᄼ', 'ᄾ',
        'ᅀ', 'ᅌ', 'ᅎ', 'ᅐ', 'ᅔ', 'ᅕ', 'ᅙ', 'ᅟ',
    ],
    'single-leading-1': [
        'ᄀ', 'ᄏ',
    ],
    'single-leading-2': [
        'ᄂ', 'ᄃ', 'ᄅ', 'ᄆ', 'ᄇ', 'ᄉ', 'ᄋ', 'ᄌ',
        'ᄎ', 'ᄐ', 'ᄑ', 'ᄒ', 'ᄼ', 'ᄾ', 'ᅀ', 'ᅌ',
        'ᅎ', 'ᅐ', 'ᅔ', 'ᅕ', 'ᅙ', 'ᅟ',
    ],
    'stacked-leading': [
        'ᄛ', 'ᄝ', 'ᄫ', 'ᄬ', 'ᅗ',
    ],
    'stacked-leading-1': [],
    'stacked-leading-2': [
        'ᄛ', 'ᄝ', 'ᄫ', 'ᄬ', 'ᅗ',
    ],
    'double-leading': [
        'ᄄ', 'ᄈ', 'ᄊ', 'ᄍ', 'ᄓ', 'ᄔ', 'ᄕ', 'ᄖ',
        'ᄗ', 'ᄘ', 'ᄙ', 'ᄚ', 'ᄜ', 'ᄞ', 'ᄟ', 'ᄠ',
        'ᄡ', 'ᄧ', 'ᄨ', 'ᄩ', 'ᄪ', 'ᄭ', 'ᄮ', 'ᄯ',
        'ᄰ', 'ᄱ', 'ᄲ', 'ᄵ', 'ᄶ', 'ᄷ', 'ᄸ', 'ᄹ',
        'ᄺ', 'ᄻ', 'ᄽ', 'ᄿ', 'ᅁ', 'ᅂ', 'ᅃ', 'ᅄ',
        'ᅅ', 'ᅆ', 'ᅇ', 'ᅈ', 'ᅉ', 'ᅊ', 'ᅋ', 'ᅍ',
        'ᅏ', 'ᅑ', 'ᅒ', 'ᅓ', 'ᅖ', 'ᅘ', 'ᅚ', 'ᅛ',
        'ᅜ', 'ᅝ', 'ᅞ', 'ꥠ', 'ꥡ', 'ꥢ', 'ꥣ', 'ꥤ',
        'ꥦ', 'ꥨ', 'ꥩ', 'ꥫ', 'ꥬ', 'ꥭ', 'ꥮ', 'ꥯ',
        'ꥰ', 'ꥱ', 'ꥳ', 'ꥴ', 'ꥶ', 'ꥷ', 'ꥹ', 'ꥺ',
        'ꥻ', 'ꥼ',
    ],
    'double-leading-1': [],
    'double-leading-2': [
        'ᄄ', 'ᄈ', 'ᄊ', 'ᄍ', 'ᄓ', 'ᄔ', 'ᄕ', 'ᄖ',
        'ᄗ', 'ᄘ', 'ᄙ', 'ᄚ', 'ᄜ', 'ᄞ', 'ᄟ', 'ᄠ',
        'ᄡ', 'ᄧ', 'ᄨ', 'ᄩ', 'ᄪ', 'ᄭ', 'ᄮ', 'ᄯ',
        'ᄰ', 'ᄱ', 'ᄲ', 'ᄵ', 'ᄶ', 'ᄷ', 'ᄸ', 'ᄹ',
        'ᄺ', 'ᄻ', 'ᄽ', 'ᄿ', 'ᅁ', 'ᅂ', 'ᅃ', 'ᅄ',
        'ᅅ', 'ᅆ', 'ᅇ', 'ᅈ', 'ᅉ', 'ᅊ', 'ᅋ', 'ᅍ',
        'ᅏ', 'ᅑ', 'ᅒ', 'ᅓ', 'ᅖ', 'ᅘ', 'ᅚ', 'ᅛ',
        'ᅜ', 'ᅝ', 'ᅞ', 'ꥠ', 'ꥡ', 'ꥢ', 'ꥣ', 'ꥤ',
        'ꥦ', 'ꥨ', 'ꥩ', 'ꥫ', 'ꥬ', 'ꥭ', 'ꥮ', 'ꥯ',
        'ꥰ', 'ꥱ', 'ꥳ', 'ꥴ', 'ꥶ', 'ꥷ', 'ꥹ', 'ꥺ',
        'ꥻ', 'ꥼ',
    ],
    'triple-leading': [
        'ᄢ', 'ᄣ', 'ᄤ', 'ᄥ', 'ᄦ', 'ᄳ', 'ᄴ', 'ꥥ',
        'ꥲ', 'ꥵ', 'ꥸ',
    ],
    'triple-leading-1': [],
    'triple-leading-2': [
        'ᄢ', 'ᄣ', 'ᄤ', 'ᄥ', 'ᄦ', 'ᄳ', 'ᄴ', 'ꥥ',
        'ꥲ', 'ꥵ', 'ꥸ',
    ],
    'single-right-vowel': [
        'ᅡ', 'ᅣ', 'ᅥ', 'ᅧ', 'ᅵ', 'ᆝ',
    ],
    'double-right-vowel': [
        'ᅢ', 'ᅤ', 'ᅦ', 'ᅨ', 'ᆘ', 'ᆙ', 'ᆥ', 'ힾ',
        'ힿ', 'ퟀ', 'ퟄ',
    ],
    'single-bottom-vowel': [
        'ᅩ', 'ᅭ', 'ᅮ', 'ᅲ', 'ᅳ', 'ᆞ', 'ᆢ', 'ᅠ',
    ],
    'single-bottom-vowel-1': [
        'ᅩ', 'ᅭ', 'ᅳ', 'ᆞ', 'ᆢ', 'ᅠ',
    ],
    'single-bottom-vowel-2': [
        'ᅮ', 'ᅲ',
    ],
    'double-bottom-vowel': [
        'ᆂ', 'ᆃ', 'ᆇ', 'ᆍ', 'ᆓ', 'ᆕ', 'ᆕ', 'ᆖ',
        'ᆠ', 'ힱ', 'ힸ', 'ힼ',
    ],
    'single-mixed-vowel': [
        'ᅪ', 'ᅬ', 'ᅯ', 'ᅱ', 'ᅶ', 'ᅷ', 'ᅸ', 'ᅹ',
        'ᅺ', 'ᅻ', 'ᅼ', 'ᅽ', 'ᅾ', 'ᅿ', 'ᆄ', 'ᆆ',
        'ᆈ', 'ᆉ', 'ᆎ', 'ᆏ', 'ᆑ', 'ᆔ', 'ᆚ', 'ᆛ',
        'ᆜ', 'ᆟ', 'ᆡ', 'ᆣ', 'ᆤ', 'ᆦ', 'ힰ', 'ힲ',
        'ힴ', 'ힵ', 'ힹ', 'ힺ', 'ퟁ', 'ퟂ', 'ퟃ', 'ퟅ',
    ],
    'double-mixed-vowel': [
        'ᅫ', 'ᅰ', 'ᆀ', 'ᆁ', 'ᆅ', 'ᆊ', 'ᆋ', 'ᆌ',
        'ᆐ', 'ᆒ', 'ᆗ', 'ᆧ', 'ힳ', 'ힶ', 'ힷ', 'ힻ',
        'ힽ', 'ퟆ',
    ],
    'single-tailing': [
        'ᆨ', 'ᆫ', 'ᆮ', 'ᆯ', 'ᆷ', 'ᆸ', 'ᆺ', 'ᆼ',
        'ᆽ', 'ᆾ', 'ᆿ', 'ᇀ', 'ᇁ', 'ᇂ', 'ᇫ', 'ᇰ',
        'ᇹ',
    ],
    'stacked-tailing': [
        'ᇢ', 'ᇦ', 'ᇴ', 'ퟝ', 
    ],
    'double-tailing': [
        'ᆩ', 'ᆪ', 'ᆬ', 'ᆭ', 'ᆰ', 'ᆱ', 'ᆲ', 'ᆳ',
        'ᆴ', 'ᆵ', 'ᆶ', 'ᆹ', 'ᆻ', 'ᇃ', 'ᇅ', 'ᇆ',
        'ᇇ', 'ᇈ', 'ᇉ', 'ᇊ', 'ᇋ', 'ᇍ', 'ᇎ', 'ᇐ',
        'ᇕ', 'ᇗ', 'ᇘ', 'ᇙ', 'ᇚ', 'ᇛ', 'ᇜ', 'ᇝ',
        'ᇟ', 'ᇠ', 'ᇡ', 'ᇣ', 'ᇤ', 'ᇥ', 'ᇧ', 'ᇨ',
        'ᇩ', 'ᇪ', 'ᇬ', 'ᇮ', 'ᇯ', 'ᇱ', 'ᇲ', 'ᇳ',
        'ᇵ', 'ᇶ', 'ᇷ', 'ᇸ', 'ᇺ', 'ᇻ', 'ᇼ', 'ᇽ',
        'ᇾ', 'ᇿ', 'ퟋ', 'ퟌ', 'ퟍ', 'ퟏ', 'ퟐ', 'ퟒ',
        'ퟓ', 'ퟔ', 'ퟛ', 'ퟞ', 'ퟠ', 'ퟢ', 'ퟣ', 'ퟥ',
        'ퟦ', 'ퟨ', 'ퟩ', 'ퟪ', 'ퟫ', 'ퟮ', 'ퟯ', 'ퟰ',
        'ퟱ', 'ퟲ', 'ퟳ', 'ퟴ', 'ퟵ', 'ퟶ', 'ퟷ', 'ퟹ',
        'ퟺ', 'ퟻ',
    ],
    'triple-tailing': [
        'ᇄ', 'ᇌ', 'ᇏ', 'ᇑ', 'ᇒ', 'ᇓ', 'ᇔ', 'ᇖ',
        'ᇞ', 'ᇭ', 'ퟎ', 'ퟑ', 'ퟕ', 'ퟖ', 'ퟗ', 'ퟘ',
        'ퟙ', 'ퟚ', 'ퟜ', 'ퟟ', 'ퟡ', 'ퟤ', 'ퟧ', 'ퟬ',
        'ퟭ', 'ퟸ',
    ],
};

interface ExampleJamo {
    [key: string]: string;
}

export const exampleJamo: ExampleJamo = {
    'single-leading': 'ᄆ',
    'single-leading-1': 'ᄏ',
    'single-leading-2': 'ᄆ',
    'stacked-leading': 'ᄫ',
    'double-leading': 'ᄈ',
    'triple-leading': 'ᄢ',
    'single-right-vowel': 'ᅡ',
    'double-right-vowel': 'ᅢ',
    'single-bottom-vowel': 'ᅮ',
    'single-bottom-vowel-1': 'ᅩ',
    'single-bottom-vowel-2': 'ᅮ',
    'double-bottom-vowel': 'ᆂ',
    'single-mixed-vowel': 'ᅪ',
    'double-mixed-vowel': 'ᅫ',
    'single-tailing': 'ᆷ',
    'stacked-tailing': 'ᇢ',
    'double-tailing': 'ᆱ',
    'triple-tailing': 'ᇌ',
};

function invertMap(map: JamoTable): Map<string, Set<JamoSubkind>> {
    const result = new Map();
    for (const [key, value] of Object.entries(map)) {
        for (const elem of value) {
            if (!result.has(elem)) {
                result.set(elem, new Set());
            }
            result.get(elem).add(key);
        }
    }
    return result;
}

export const subkindOf: Map<string, Set<JamoSubkind>> = invertMap(jamoTable);

export function getJamos(requestedKind: JamoKind | JamoSubkind): string[] {
    return Object.keys(jamoTable).flatMap((kind) => {
        if (kind.endsWith(requestedKind)) {
            return jamoTable[kind as JamoSubkind];
        }
        return [];
    });
}

export function getExampleJamo(requestedKind: JamoKind | JamoSubkind): string {
    return Object.keys(exampleJamo).find((kind) => kind.endsWith(requestedKind)) as string;
}

export function selectLayout(layouts: Layout[], focusJamo: string, jamos: string[]): Layout {
    layouts = layouts.filter(
        (layout) => Object.entries(jamoTable).some(
            ([subkind, list]) => subkind.endsWith(layout.focus) && list.includes(focusJamo)
        )
    );
    for (const jamo of [focusJamo, ...jamos]) {
        layouts = layouts.filter(
            (layout) => layout.elems.values().some(
                (elem) => Object.entries(jamoTable).some(
                    ([subkind, list]) => subkind.endsWith(elem) && list.includes(jamo)
                )
            )
        )
    }
    if (layouts.length === 1) {
        return layouts[0];
    }
    else {
        console.error(focusJamo, jamos, layouts);
        throw new Error(`Ambiguous layout for jamos: ${jamos}. Got ${layouts}.`);
    }
}
