import {ResizedGlyph} from "@/app/jamo_layouts";
import {Glyph, Point} from "@/app/parse_glyph";
import {
    adjustGlyphThickness,
    Bounds,
    glyphActualBounds,
    offsetGlyphSegments,
    reduceGlyphPaths,
    synthesizeBoldGlyph
} from "@/app/font_utils";
import {GlyphView} from "@/app/GlyphView";
import React from "react";
import Konva from "konva";
import {Bezier} from "bezier-js";
import {Circle, Line} from "react-konva";

type PropType = Readonly<{
    stageRef?: React.RefObject<Konva.Group | null>,
    resizedGlyph: ResizedGlyph,
    rescale: (p: Point) => number[],
    bounds: Bounds,
    showPoints?: boolean,
} & Konva.LineConfig>;

export function ResizedGlyphView(
    {resizedGlyph, rescale, bounds, showPoints, ...props}: PropType
) {
    const actualBounds = glyphActualBounds(resizedGlyph.glyph);
    const resizedBounds = resizedGlyph.bounds;
    const targetBounds = {
        left: bounds.left + resizedBounds.left * (bounds.right - bounds.left),
        right: bounds.left + resizedBounds.right * (bounds.right - bounds.left),
        top: bounds.bottom + resizedBounds.top * (bounds.top - bounds.bottom),
        bottom: bounds.bottom + resizedBounds.bottom * (bounds.top - bounds.bottom),
    }

    const xScale = (targetBounds.right - targetBounds.left) / (actualBounds.right - actualBounds.left);
    const yScale = (targetBounds.top - targetBounds.bottom) / (actualBounds.top - actualBounds.bottom);

    // const boldOffset = 30;
    // const [reducedGlyph, boldGlyph] = React.useMemo(() => {
    //     const start = performance.now();
    //     const reducedGlyph = reduceGlyphPaths(resizedGlyph.glyph);
    //     const reduceTime = performance.now() - start;
    //     const [boldBeziers, boldGlyph] = synthesizeBoldGlyph(reducedGlyph, boldOffset);
    //     const synthTime = performance.now() - reduceTime - start;
    //     console.log("Synthesize bold glyph reducetime=", reduceTime, "ms, synthtime=", synthTime, "ms");
    //     return [reducedGlyph, boldGlyph];
    // }, [resizedGlyph.glyph]);

    // const start = performance.now();
    // const reducedGlyph = reduceGlyphPaths(resizedGlyph.glyph);
    // const reduceTime = performance.now() - start;
    // const [boldBeziers, boldGlyph] = synthesizeBoldGlyph(reducedGlyph, boldOffset);
    // const synthTime = performance.now() - reduceTime - start;
    // console.log("Synthesize bold glyph reducetime=", reduceTime, "ms, synthtime=", synthTime, "ms");

    // const adjustedGlyph = React.useMemo(() => {
    //     return adjustGlyphThickness(reducedGlyph, boldGlyph, boldOffset, xScale, yScale);
    // }, [resizedGlyph.glyph, xScale, yScale]);

    function glyphRescale(p: Point): number[] {
        return rescale({
            x: targetBounds.left + (p.x - actualBounds.left) * xScale,
            y: targetBounds.bottom + (p.y - actualBounds.bottom) * yScale,
        });
    }

    // function glyphRescale2(p: Point): number[] {
    //     return rescale({
    //         x: targetBounds.left + (p.x - actualBounds.left) * xScale,
    //         y: targetBounds.bottom + (p.y - actualBounds.bottom) * yScale - 200,
    //     });
    // }
    // function glyphRescale3(p: Point): number[] {
    //     return rescale({
    //         x: targetBounds.left + (p.x - actualBounds.left) * xScale,
    //         y: targetBounds.bottom + (p.y - actualBounds.bottom) * yScale - 400,
    //     });
    // }
    //
    // const offsetBeziers: Bezier[][] = offsetGlyphSegments(reducedGlyph, boldOffset);

    return (
        <React.Fragment>
            <GlyphView
                glyph={resizedGlyph.glyph}
                rescale={glyphRescale}
                showPoints={false}
                {...props}
            />
            {/*{reducedGlyph.paths.map((path, idx) => (*/}
            {/*    <React.Fragment key={idx}>*/}
            {/*        <Circle*/}
            {/*            x={glyphRescale(path.start)[0]}*/}
            {/*            y={glyphRescale(path.start)[1]}*/}
            {/*            radius={1}*/}
            {/*            fill={"#ff0000"}*/}
            {/*        />*/}
            {/*        {path.segments.map((segment, sIdx) => (*/}
            {/*            <Circle*/}
            {/*                key={sIdx}*/}
            {/*                x={glyphRescale(segment.p)[0]}*/}
            {/*                y={glyphRescale(segment.p)[1]}*/}
            {/*                radius={1}*/}
            {/*                fill={"#00ff00"}*/}
            {/*            />*/}
            {/*        ))}*/}
            {/*    </React.Fragment>*/}
            {/*))}*/}
            {/*{offsetBeziers.map((bezier, idx) => (*/}
            {/*    <React.Fragment key={idx}>*/}
            {/*        {bezier.map((b, bIdx) =>*/}
            {/*            <React.Fragment key={bIdx}>*/}
            {/*                <Line*/}
            {/*                    points={[*/}
            {/*                        ...glyphRescale(b.points[0]),*/}
            {/*                        ...glyphRescale(b.points[1]),*/}
            {/*                        ...glyphRescale(b.points[2]),*/}
            {/*                        ...glyphRescale(b.points[3])*/}
            {/*                    ]}*/}
            {/*                    bezier={true}*/}
            {/*                    stroke={"white"}*/}
            {/*                    strokeWidth={1}*/}
            {/*                />*/}
            {/*                <Circle*/}
            {/*                    x={glyphRescale(b.points[0])[0]}*/}
            {/*                    y={glyphRescale(b.points[0])[1]}*/}
            {/*                    radius={1.5}*/}
            {/*                    fill={"yellow"}*/}
            {/*                />*/}
            {/*            </React.Fragment>*/}
            {/*        )}*/}
            {/*    </React.Fragment>*/}
            {/*))}*/}
            {/*{boldBeziers.map((bezier, idx) => (*/}
            {/*    <React.Fragment key={idx}>*/}
            {/*        {bezier.map((b, bIdx) =>*/}
            {/*            <React.Fragment key={bIdx}>*/}
            {/*                <Line*/}
            {/*                    points={[*/}
            {/*                        ...glyphRescale2(b.points[0]),*/}
            {/*                        ...glyphRescale2(b.points[1]),*/}
            {/*                        ...glyphRescale2(b.points[2]),*/}
            {/*                        ...glyphRescale2(b.points[3])*/}
            {/*                    ]}*/}
            {/*                    bezier={true}*/}
            {/*                    stroke={"white"}*/}
            {/*                    strokeWidth={1}*/}
            {/*                />*/}
            {/*                <Circle*/}
            {/*                    x={glyphRescale2(b.points[0])[0]}*/}
            {/*                    y={glyphRescale2(b.points[0])[1]}*/}
            {/*                    radius={1.5}*/}
            {/*                    fill={"yellow"}*/}
            {/*                />*/}
            {/*            </React.Fragment>*/}
            {/*        )}*/}
            {/*    </React.Fragment>*/}
            {/*))}*/}
            {/*<GlyphView*/}
            {/*    glyph={adjustedGlyph}*/}
            {/*    rescale={glyphRescale3}*/}
            {/*    showPoints={false}*/}
            {/*    {...props}*/}
            {/*    stroke={"yellow"}*/}
            {/*/>*/}
        </React.Fragment>
    );
}