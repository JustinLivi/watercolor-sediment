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
    const fps = 60;
    const fpsInterval = 1000 / fps;

    let stopped = false;
    let now;
    let elapsed;
    let then = window.performance.now();

    let seedcount = 50;
    // overall distance from center
    const maxh = height;
    let theta = 0;
    const hm = []; // hue array
    const sm = []; // saturation array
    const lm = []; // lightness array
    const dhm = []; // delta hue array
    const dsm = []; // delta saturation array
    const dlm = []; // delta lightness array
    let dm = []; // distance array
    const stm = []; // streakiness array

    function changeDm( count ) {
        dm[count] = constrain( dm[count] + random( -1, 1 ), 0, height );
    }

    function changeColor( count ) {
        stm[count] += random( -0.01, 0.01 );
        stm[count] = constrain( stm[count], 0.1, 1 );
        dhm[count] += random( -stm[count], stm[count]);
        dhm[count] = constrain( dhm[count], hm[count] - 20, hm[count] + 20 );
        dsm[count] += random( -stm[count], stm[count]);
        dsm[count] = constrain( dsm[count], sm[count] - 20, sm[count] + 20 );
        dlm[count] += random( -stm[count], stm[count]);
        dlm[count] = constrain( dlm[count], lm[count] - 20, lm[count] + 20 );
    }

    function blend( count, distance ) {
        let prev = seedcount - 1;
        if ( count < seedcount - 1 ) prev = count + 1;
        const formax = Math.abs( dm[prev] - distance );
        changeColor( count );
        for ( let count2 = 0; count2 < formax; count2++ ) {
            for ( let count3 = 0; count3 < 10 / 3 * stm[count] + 5 / 3; count3++ ) {
                const hi = ( dhm[prev] - dhm[count]) / formax;
                const si = ( dsm[prev] - dsm[count]) / formax;
                const li = ( dlm[prev] - dlm[count]) / formax;
                ctx.save();
                ctx.translate( distance + count2 + random( -1, 1 ), random( -stm[count] * 10, stm[count] * 10 ));
                ctx.rotate( random( Math.PI * 2 ));
                ctx.beginPath();
                ctx.fillStyle = `hsla(${
                        Math.floor( dhm[count] + random( -1, 1 ) + ( count2 * hi ))
                    },${
                        Math.floor( dsm[count] + random( -0.5, 0.5 ) + ( count2 * si ))
                    }%,${
                        Math.floor( dlm[count] + random( -0.5, 0.5 ) + ( count2 * li ))
                    }%, ${
                        random( 2, 10 ) / 255
                    })`;
                ctx.ellipse( 0, 0, random( 2, 10 + 5 * stm[count]), random( 2, 10 + 5 * stm[count]), 0, 0, 2 * Math.PI );
                ctx.fill();
                ctx.restore();
            }
        }
    }

    function generate() {
        for ( let count = 0; count < seedcount; count++ ) {
            changeDm( count );
        }
        dm[0] = 0;
        dm[seedcount - 1] = height;
        dm = sortBy( dm );
        for ( let count = 0; count < seedcount; count++ ) {
            ctx.fillStyle = `hsl(${dhm[count]}, ${dsm[count]}, ${dsm[count]})`;
            blend( count, dm[count]);
        }
    }

    function draw() {
        for ( let i = 0; i < 2; i++ ) {
            if ( theta < width ) {
                ctx.save();
                ctx.translate( theta, 0 );
                ctx.rotate( Math.PI / 2 );
                generate();
                ctx.restore();
                theta++;
            }
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
            dm[count] = random( maxh );
            stm[count] = random( 0.1, 1 );
        }
        // console.log( dm[1]);
        dm[0] = 0;
        dm[seedcount - 1] = height;
        dm = sortBy( dm );
        theta = -20;
    }

    function animate() {
        if ( stopped ) return;
        raf( animate );
        now = window.performance.now();
        elapsed = now - then;

        if ( elapsed > 2000 ) {
            then = now - ( elapsed % fpsInterval );
        }
        else if ( elapsed > fpsInterval ) {
            then = now - ( elapsed % fpsInterval );
            draw( 1 + ( elapsed - fpsInterval ) / fpsInterval );
        }
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
