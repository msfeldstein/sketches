module.exports = {
    rand(magnitude = 1) {
        return (Math.random() - 0.5) * 2 * magnitude
    },

    lerp(t, min, max) {
        return min + (max - min) * t
    },

    dist(x1, y1, x2, y2) {
        const dx = x2 - x1
        const dy = y2 - y1
        return Math.sqrt(dx * dx + dy * dy)
    },

    normalDistribution: () => { // Standard Normal variate using Box-Muller transform.
        var u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }
}