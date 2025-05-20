import {JSONPath} from "@astronautlabs/jsonpath";

export type TTXObject = {
    ttFont: {
        name: {
            namerecord: {
                '@_nameID': string,
                '#text': string,
            }[]
        },
        GlyphOrder: {
            GlyphID: {
                "@_id": string,
                "@_name": string,
            }[]
        }
    }
};

export type Charstring = {
    '@_name': string,
    '@_fdSelectIndex': string,
    '#text': string,
};

export type FontDict = {
    Private: {
        defaultWidthX: { '@_value': string },
        nominalWidthX: { '@_value': string },
    },
};

export type OS2 = {
    sTypoAscender: { '@_value': string },
    sTypoDescender: { '@_value': string },
};

export type Cmap4 = {
    map: {
        "@_code": string,
        "@_name": string,
    }[];
};

export class TTXWrapper {
    ttx: TTXObject;

    constructor(ttx: TTXObject) {
        this.ttx = ttx;
    }

    getFontName(): string {
        return JSONPath.query(this.ttx, '$.ttFont.name.namerecord[?(@.@_nameID == "4")]')[0]['#text'];
    }

    getFontVersion(): string {
        return JSONPath.query(this.ttx, '$.ttFont.name.namerecord[?(@.@_nameID == "5")]')[0]['#text'];
    }

    getNumberOfGlyphs(): number {
        return array(JSONPath.query(this.ttx, '$.ttFont.GlyphOrder.GlyphID')[0]).length;
    }

    getFDArray(): FontDict[] {
        return array(JSONPath.query(this.ttx, '$.ttFont.CFF.CFFFont.FDArray.FontDict')[0]);
    }

    getCharstrings(): Charstring[] {
        return array(JSONPath.query(this.ttx, '$.ttFont.CFF.CFFFont.CharStrings.CharString')[0]);
    }

    getOS2(): OS2 {
        return JSONPath.query(this.ttx, '$.ttFont.OS_2')[0];
    }

    getCmap4(): Cmap4 {
        return JSONPath.query(this.ttx, '$.ttFont.cmap.cmap_format_4[?(@.@_platformID == "0")]')[0];
    }

}

function array<T>(x: T | Array<T>): Array<T> {
    if (Array.isArray(x)) {
        return x;
    }
    return [x];
}
