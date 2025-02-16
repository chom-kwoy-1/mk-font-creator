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
