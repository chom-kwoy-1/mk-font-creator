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
            GlyphID: GlyphID[]
        }
    }
};

export type GlyphID = {
    "@_id": string,
    "@_name": string,
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

export type Hmtx = {
    '@_name': string,
    '@_width': string,
    '@_lsb': string,
};

export type Vmtx = {
    '@_name': string,
    '@_height': string,
    '@_tsb': string,
};

export class TTXWrapper {
    ttx: TTXObject;

    constructor(ttx: TTXObject) {
        this.ttx = ttx;
    }

    getGlyphOrder(): GlyphID[] {
        return array(JSONPath.query(this.ttx, '$.ttFont.GlyphOrder.GlyphID')[0]);
    }

    getFontName(): string {
        return JSONPath.query(this.ttx, '$.ttFont.name.namerecord[?(@.@_nameID == "4")]')[0]['#text'];
    }

    getFontVersion(): string {
        return JSONPath.query(this.ttx, '$.ttFont.name.namerecord[?(@.@_nameID == "5")]')[0]['#text'];
    }

    getNumberOfGlyphs(): number {
        return this.getGlyphOrder().length;
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

    getHmtx(): Hmtx[] {
        return array(JSONPath.query(this.ttx, '$.ttFont.hmtx.mtx')[0]);
    }

    getVmtx(): Vmtx[] {
        return array(JSONPath.query(this.ttx, '$.ttFont.vmtx.mtx')[0]);
    }
}

function array<T>(x: T | Array<T>): Array<T> {
    if (Array.isArray(x)) {
        return x;
    }
    return [x];
}
