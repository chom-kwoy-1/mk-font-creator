export type TTXObject = {
    ttFont: {
        name: {
            namerecord: {
                '@_nameID': string,
                '#text': string,
            }[]
        },
        GlyphOrder: {
            GlyphID: string[]
        }
    }
};
