'use strict';

const raf = require( 'raf' );
const sortBy = require( 'lodash.sortby' );

function random( low, high ) {
    let h = high;
    let l = low;
    if ( arguments.length === 1 ) {
        h = low;
        l = 0;
    }
    return ( h - l ) * Math.random() + l;
}

function constrain( val, low, high ) {
    if ( val < low ) return low;
    if ( val > high ) return high;
    return val;
}

module.exports = function createSketch( canvas ) {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext( '2d' );

    let stopped = false;

    let seedcount = 50;
    let theta = 0;
    const hm = []; // hue
    const sm = []; // saturation
    const lm = []; // lightness
    const dhm = []; // delta hue
    const dsm = []; // delta saturation
    const dlm = []; // delta lightness
    let dm = []; // distance
    const stm = []; // streakiness

    function blend( count, distance ) {
        let prev = seedcount - 1;
        if ( count < seedcount - 1 ) prev = count + 1;
        const formax = Math.abs( dm[prev] - distance );
        const stmc = stm[count] = constrain( stm[count] + random( -0.01, 0.01 ), 0.1, 1 );
        const dhmc = dhm[count] = constrain( dhm[count] + random( -stmc, stmc ), hm[count] - 20, hm[count] + 20 );
        const dsmc = dsm[count] = constrain( dsm[count] + random( -stmc, stmc ), sm[count] - 20, sm[count] + 20 );
        const dlmc = dlm[count] = constrain( dlm[count] + random( -stmc, stmc ), lm[count] - 20, lm[count] + 20 );
        for ( let count2 = 0; count2 < formax; count2++ ) {
            for ( let count3 = 0; count3 < 10 / 3 * stm[count] + 5 / 3; count3++ ) {
                ctx.save();
                ctx.translate( distance + count2 + random( -1, 1 ), random( -stm[count] * 10, stm[count] * 10 ));
                ctx.beginPath();
                ctx.fillStyle = `hsla(${
                        Math.floor( dhmc + random( -1, 1 ) + count2 * ( dhm[prev] - dhmc ) / formax )
                    },${
                        Math.floor( dsmc + random( -0.5, 0.5 ) + count2 * ( dsm[prev] - dsmc ) / formax )
                    }%,${
                        Math.floor( dlmc + random( -0.5, 0.5 ) + count2 * ( dlm[prev] - dlmc ) / formax )
                    }%, ${
                        random( 2, 10 ) / 255
                    })`;
                ctx.ellipse( 0, 0, random( 2, 10 + 5 * stmc ), random( 2, 10 + 5 * stmc ), 0, 0, random( Math.PI * 2 ));
                ctx.fill();
                ctx.restore();
            }
        }
    }

    function generate() {
        for ( let count = 0; count < seedcount; count++ ) {
            dm[count] = constrain( dm[count] + random( -1, 1 ), 0, height );
        }
        dm[0] = 0;
        dm[seedcount - 1] = height;
        dm = sortBy( dm );
        for ( let count = 0; count < seedcount; count++ ) {
            blend( count, dm[count]);
        }
    }

    function draw() {
        if ( theta < width ) {
            ctx.save();
            ctx.translate( theta, 0 );
            ctx.rotate( Math.PI / 2 );
            generate();
            ctx.restore();
            theta++;
        }
    }

    function reset() {
        ctx.clearRect( 0, 0, width, height );
        seedcount = Math.floor( random( 4, 20 ));
        const centerhue = random( 0, 360 );
        const variance = random( 10, 40 );
        for ( let count = 0; count < seedcount; count++ ) {
            hm[count] = random( centerhue - variance, centerhue + variance );
            sm[count] = random( 45, 70 );
            lm[count] = random( 20, 90 );
            dhm[count] = hm[count];
            dsm[count] = sm[count];
            dlm[count] = lm[count];
            dm[count] = random( height );
            stm[count] = random( 0.1, 1 );
        }
        dm[0] = 0;
        dm[seedcount - 1] = height;
        dm = sortBy( dm );
        theta = -20;
    }

    function animate() {
        if ( stopped ) return;
        raf( animate );
        draw();
    }

    canvas.addEventListener( 'click', reset );

    reset();
    animate();

    return {
        stop: function stop() {
            stopped = true;
        },
    };
};
