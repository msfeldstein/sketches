module.exports = function swiss(opts) {
  const vertices = []
    for (var i = 0; i < opts.numSides; i++) {
      const thetaStart = Math.PI * 2 / opts.numSides * i
      const thetaStop = Math.PI * 2 / opts.numSides * (i + 1)
      const r = 1
      const rIn = opts.topRadius
      const capHeight = opts.capHeight
      const x = r * Math.cos(thetaStart)
      const y = r * Math.sin(thetaStart)
      const x2 = r * Math.cos(thetaStop)
      const y2 = r * Math.sin(thetaStop)

      const bottomPoint = [0, -1, 0]
      const lowerEdgeP1 = [x, 0, y]
      const lowerEdgeP2 = [x2, 0, y2]
      const upperEdgeP1 = [x, opts.sideEdgeHeight, y]
      const upperEdgeP2 = [x2, opts.sideEdgeHeight, y2]
      const innerEdgeP1 = [rIn * Math.cos(thetaStart), capHeight, rIn * Math.sin(thetaStart)]
      const innerEdgeP2 = [rIn * Math.cos(thetaStop), capHeight, rIn * Math.sin(thetaStop)]

      const topCenter = [0, capHeight, 0]
      // To Bottom Point
      vertices.push(
        lowerEdgeP1,
        lowerEdgeP2,
        bottomPoint
      )

      // Side Edges
      vertices.push(
        lowerEdgeP2,
        lowerEdgeP1,
        upperEdgeP1,

        lowerEdgeP2,
        upperEdgeP1,
        upperEdgeP2
      )

      vertices.push(
        upperEdgeP2,
        upperEdgeP1,
        innerEdgeP2,

        innerEdgeP2,
        upperEdgeP1,
        innerEdgeP1
      )

      vertices.push(
        innerEdgeP2,
        innerEdgeP1,
        topCenter
      )
    }
  return vertices.flat()
}
