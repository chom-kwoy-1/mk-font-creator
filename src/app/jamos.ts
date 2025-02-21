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
        // TODO
    ],
    'triple-leading': [
        // TODO
    ],
    'single-right-vowel': [
        'ᅡ', 'ᅣ', 'ᅥ', 'ᅧ', 'ᅵ', 'ᆝ', 'ᅠ',
    ],
    'double-right-vowel': [
        // TODO
    ],
    'single-bottom-vowel': [
        'ᅩ', 'ᅭ', 'ᅮ', 'ᅲ', 'ᅳ', 'ᆞ', 'ᆢ',
    ],
    'double-bottom-vowel': [
        // TODO
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
        // TODO
    ],
    'stacked-tailing': [
        // TODO
    ],
    'double-tailing': [
        // TODO
    ],
    'triple-tailing': [
        // TODO
    ],
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
