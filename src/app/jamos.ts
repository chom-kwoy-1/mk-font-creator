import {JamoKind, JamoSubkind} from "@/app/jamo_layouts";

interface JamoTable {
    [key: string]: string[];
}

export const jamoTable: JamoTable = {
    'single-leading': [
        'ᄀ', 'ᄂ', 'ᄃ', 'ᄅ', 'ᄆ', 'ᄇ', 'ᄉ', 'ᄋ',
        'ᄌ', 'ᄎ', 'ᄏ', 'ᄐ', 'ᄑ', 'ᄒ', 'ᄼ', 'ᄾ',
        'ᅀ', 'ᅌ', 'ᅎ', 'ᅐ', 'ᅔ', 'ᅕ', 'ᅙ', 'ᅟ',
    ],
    'stacked-leading': [
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
    'triple-leading': [
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
    'stacked-leading': 'ᄫ',
    'double-leading': 'ᄈ',
    'triple-leading': 'ᄢ',
    'single-right-vowel': 'ᅡ',
    'double-right-vowel': 'ᅢ',
    'single-bottom-vowel': 'ᅮ',
    'double-bottom-vowel': 'ᆂ',
    'single-mixed-vowel': 'ᅪ',
    'double-mixed-vowel': 'ᅫ',
    'single-tailing': 'ᆷ',
    'stacked-tailing': 'ᇢ',
    'double-tailing': 'ᆱ',
    'triple-tailing': 'ᇌ',
};

export const subkindOf: Map<string, JamoSubkind> = new Map(
    Object.entries(jamoTable).flatMap(
        ([subkind, jamos]) => jamos.map(
            (jamo) => [jamo, subkind as JamoSubkind]
        ))
);

export function getJamos(requestedKind: JamoKind | JamoSubkind): string[] {
    return Object.keys(jamoTable).flatMap((kind) => {
        if (kind.endsWith(requestedKind)) {
            return jamoTable[kind];
        }
        return [];
    });
}

export function getExampleJamo(requestedKind: JamoKind | JamoSubkind): string {
    return Object.keys(exampleJamo).find((kind) => kind.endsWith(requestedKind)) as string;
}
