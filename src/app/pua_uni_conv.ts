import {PUA_CONV_TABLE} from "@/app/pua_uni_table";

const UNI_TO_PUA = Object.fromEntries(Object.entries(PUA_CONV_TABLE).map(a => a.reverse()));
const UNI_TO_PUA_3 = Object.fromEntries(Object.entries(UNI_TO_PUA).filter(a => a[0].length === 3));
const UNI_TO_PUA_2 = Object.fromEntries(Object.entries(UNI_TO_PUA).filter(a => a[0].length === 2));
const UNI_TO_PUA_1 = Object.fromEntries(Object.entries(UNI_TO_PUA).filter(a => a[0].length === 1));

export function uniToPua(s: string): string {
    s = s.normalize('NFKC');
    for (let i = 0; i < s.length - 2; i += 3) {
        if (s.slice(i, i + 3) in UNI_TO_PUA_3) {
            s = s.slice(0, i) + UNI_TO_PUA_3[s.slice(i, i + 3)] + s.slice(i + 3);
        }
    }
    for (let i = 0; i < s.length - 1; i += 2) {
        if (s.slice(i, i + 2) in UNI_TO_PUA_2) {
            s = s.slice(0, i) + UNI_TO_PUA_2[s.slice(i, i + 2)] + s.slice(i + 2);
        }
    }
    for (let i = 0; i < s.length; i++) {
        if (s[i] in UNI_TO_PUA_1) {
            s = s.slice(0, i) + UNI_TO_PUA_1[s[i]] + s.slice(i + 1);
        }
    }
    return s;
}
