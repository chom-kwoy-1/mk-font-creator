import {JSONPath} from "@astronautlabs/jsonpath";

export type TTXObject = {
    ttFont: any[]
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
        defaultWidthX: { '@_value': string }[],
        nominalWidthX: { '@_value': string }[],
    }[],
};

export type OS2 = {
    sTypoAscender: { '@_value': string }[],
    sTypoDescender: { '@_value': string }[],
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

export type Gsub = {
    'Version': {
        '@_value': '0x00010000',
    }[],
    'ScriptList': {
        'ScriptRecord': {
            '@_index': string,
            'ScriptTag': {
                '@_value': string,
            }[],
            'Script': {
                'DefaultLangSys': {
                    'ReqFeatureIndex': {
                        '@_value': string,
                    }[],
                    'FeatureIndex': {
                        '@_index': string,
                        '@_value': string,
                    }[],
                }[],
            }[],
        }[],
    }[],
    'FeatureList': {
        'FeatureRecord': {
            '@_index': string,
            'FeatureTag': {
                '@_value': string,
            }[],
            'Feature': {
                'LookupListIndex': {
                    '@_index': string,
                    '@_value': string,
                }[],
            }[],
        }[],
    }[],
    'LookupList': {
        'Lookup': {
            '@_index': string,
            'LookupType': {
                '@_value': string,
            }[],
            'LookupFlag': {
                '@_value': string,
            }[],
            'SingleSubst'?: SingleSubst[],
            'ChainContextSubst'?: ChainContextSubst[],
            'LigatureSubst'?: LigatureSubst[],
        }[],
    }[],
};

export type SingleSubst = {
    'Substitution': {
        '@_in': string,
        '@_out': string,
    }[],
};

export type ChainContextSubst = {
    '@_index': string,
    '@_Format': string,
    'BacktrackCoverage': {
        '@_index': string,
        'Glyph': {
            '@_value': string,
        }[];
    }[],
    'InputCoverage': {
        '@_index': string,
        'Glyph': {
            '@_value': string,
        }[];
    }[],
    'LookAheadCoverage': {
        '@_index': string,
        'Glyph': {
            '@_value': string,
        }[];
    }[],
    'SubstLookupRecord': {
        '@_index': string,
        'SequenceIndex': {
            '@_value': string,
        }[],
        'LookupListIndex': {
            '@_value': string,
        }[],
    }[],
};

export type LigatureSubst = {
    '@_index': string,
    'LigatureSet': {
        '@_glyph': string,
        'Ligature': {
            '@_components': string,
            '@_glyph': string,
        }[],
    }[],
};

export class TTXWrapper {
    ttx: TTXObject;
    uniToGlyphName: Map<number, string>;
    glyphNameToCs: Map<string, Charstring>;

    constructor(ttx: TTXObject) {
        this.ttx = ttx;

        const cmap = this.getCmap4();
        const uniToGlyphName = new Map<number, string>();
        cmap.map.forEach((c) => {
            uniToGlyphName.set(
                parseInt(c['@_code'], 16),
                c['@_name'],
            );
        });
        this.uniToGlyphName = uniToGlyphName;

        const charstrings = this.getCharstrings();
        const glyphNameToCs = new Map<string, Charstring>();
        charstrings.forEach((cs) => {
            glyphNameToCs.set(
                cs["@_name"],
                cs,
            );
        });
        this.glyphNameToCs = glyphNameToCs;
    }

    getGlyphOrder(): GlyphID[] {
        return JSONPath.query(this.ttx, '$.ttFont[0].GlyphOrder[0].GlyphID')[0];
    }

    getFontName(): string {
        return JSONPath.query(this.ttx, '$.ttFont[0].name[0].namerecord[?(@.@_nameID == "4")]')[0]['#text'];
    }

    getFontVersion(): string {
        return JSONPath.query(this.ttx, '$.ttFont[0].name[0].namerecord[?(@.@_nameID == "5")]')[0]['#text'];
    }

    getNumberOfGlyphs(): number {
        return this.getGlyphOrder().length;
    }

    getFDArray(): FontDict[] {
        return JSONPath.query(this.ttx, '$.ttFont[0].CFF[0].CFFFont[0].FDArray[0].FontDict')[0];
    }

    getCharstrings(): Charstring[] {
        return JSONPath.query(this.ttx, '$.ttFont[0].CFF[0].CFFFont[0].CharStrings[0].CharString')[0];
    }

    getOS2(): OS2 {
        return JSONPath.query(this.ttx, '$.ttFont[0].OS_2[0]')[0];
    }

    getCmap4(): Cmap4 {
        return JSONPath.query(this.ttx, '$.ttFont[0].cmap[0].cmap_format_4[?(@.@_platformID == "0")]')[0];
    }

    findGlyphName(codePoint: number | string): string | undefined {
        if (typeof codePoint === 'string') {
            codePoint = codePoint.codePointAt(0)!;
        }
        return this.uniToGlyphName.get(codePoint);
    }

    findCharstring(glyphName: string): Charstring | undefined {
        return this.glyphNameToCs.get(glyphName);
    }

    getHmtx(): Hmtx[] {
        return array(JSONPath.query(this.ttx, '$.ttFont[0].hmtx[0].mtx')[0]);
    }

    getVmtx(): Vmtx[] {
        return array(JSONPath.query(this.ttx, '$.ttFont[0].vmtx[0].mtx')[0]);
    }

    getGsub(): Gsub {
        let gsub: Gsub;
        gsub = JSONPath.query(this.ttx, '$.ttFont[0].GSUB[0]')[0];
        if (!gsub) {
            gsub = {
                'Version': [{
                    '@_value': '0x00010000',
                }],
                'ScriptList': [{
                    'ScriptRecord': [{
                        '@_index': '0',
                        'ScriptTag': [{
                            '@_value': 'DFLT',
                        }],
                        'Script': [{
                            'DefaultLangSys': [{
                                'ReqFeatureIndex': [{
                                    '@_value': '65535',
                                }],
                                'FeatureIndex': [],
                            }],
                        }],
                    }]
                }],
                'FeatureList': [{
                    'FeatureRecord': [],
                }],
                'LookupList': [{
                    'Lookup': [],
                }],
            };
            this.ttx.ttFont[0].GSUB = [gsub];
        }
        return gsub;
    }
}

function array<T>(x: T | Array<T>): Array<T> {
    if (Array.isArray(x)) {
        return x;
    }
    return [x];
}
