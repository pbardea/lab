// Point helper functions.
const pointsToVec = (pointA, pointB) => {
    const lengthX = pointB.x - pointA.x
    const lengthY = pointB.y - pointA.y
    return {
        mag: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
        ang: Math.atan2(lengthY, lengthX)
    }
}

// Vector helper functions.
const vecToPoint = (v) => {
    return {
        x: Math.cos(v.ang) * v.mag,
        y: Math.sin(v.ang) * v.mag
    }
}

const scale = (v, factor) => {
    return {
        mag: v.mag * factor,
        ang: v.ang
    }
}

const add = (p1, p2) => {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    }
}

// Control points.
const smoothing = 0.15

const controlPoint = (current, previous, next, reverse) => {
    const p = previous || current
    const n = next || current

    const controlVector = reverse ? pointsToVec(n, p) : pointsToVec(p, n)
    return add(current, vecToPoint(scale(controlVector, smoothing)))
}

const bezierCommand = (point, i, points) => {
    const cp1 = controlPoint(points[i - 1], points[i - 2], point)
    const cp2 = controlPoint(point, points[i - 1], points[i + 1], true)
    // N.B.: We add 0.001 here to make the line not straight. This solves a
    // clipping bug in browsers.
    return `C ${cp1.x},${cp1.y+0.001} ${cp2.x},${cp2.y} ${point.x},${point.y}`
}

const SVGPath = (points) => {
    return points.reduce((acc, point, i, a) => i === 0 ?
                              `M ${point.x},${point.y}` :
                              `${acc} ${bezierCommand(point, i, a)}` , '')
}

export default SVGPath
