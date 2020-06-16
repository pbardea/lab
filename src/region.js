import HLCToHex from './color-conv.js';

// Find the invalid regions for every column.
const findInvalidRegions = (colors, colorMaker) => {
    const ret = colors.map((color, i) => {
        const interval = 1.0 / 100.0
        var regions = []
        var curPos = 0.0
        var curRegion = {start: null, end: null, groupID: -1}
        while (curPos < 1.0) {
            if (HLCToHex(colorMaker(color, curPos)) === "") {
                // This point that we're testing is invalid.
                if (curRegion.start === null) {
                    // Start a new invalid region.
                    curRegion.start = 1.0 - curPos
                }
            } else {
                // This point is valid.
                if (curRegion.start !== null) {
                    // We have a region to finish.
                    curRegion.end = 1.0 - curPos
                    const copy = Object.assign({}, curRegion)
                    regions.push(copy)
                    curRegion = {start: null, end: null, groupID: -1}
                }
            }
            curPos += interval
        }
        curPos -= interval
        if (curRegion.start !== null) {
            // Finish off the last region if needed.
            curRegion.end = 1.0 - curPos
            const copy = Object.assign({}, curRegion)
            regions.push(copy)
        }
        return regions
    })
    return ret
}

// Grouping.

// The percentage that the 2 regions overlap with regionA.
const overlapAmount = (regionA, regionB) => {
    if (regionA.end > regionB.start || regionA.start < regionB.end) {
        return 0
    }
    const endOverlap = Math.max(regionA.end, regionB.end)
    const startOverlap = Math.min(regionA.start, regionB.start)
    return (endOverlap - startOverlap) / (regionA.end - regionA.start)
}

const overlapScore = (regionA, regionB) => {
    return Math.max(overlapAmount(regionA, regionB), overlapAmount(regionB, regionA))
}

// Return the index of the region in the array that
// overlaps most with the given region.
const findMaxOverlap = (targetRegion, regions) => {
    var maxOverlapIdx = -1
    var maxOverlap = 0
    regions.forEach((region, i) => {
        const curOverlap = overlapScore(targetRegion, region);
        if (region.groupID === -1 && curOverlap > maxOverlap) {
            maxOverlapIdx = i
            maxOverlap = curOverlap
        }
    })
    return maxOverlapIdx
}



// Given a starting region, compute all regions that belong in its group.
const assignOverlap = (indexedRegions, curCol, regionIdx, groupID) => {
    // Assign the region at indexedRegions[curCol][regionIdx] the given groupID.
    // If there is no next column, return.
    // Find the region in the next column that has the maximum overlap.
    // If somoething is found, recurse on that.
    // If nothing is found, return.
    const targetRegion = indexedRegions[curCol][regionIdx]
    indexedRegions[curCol][regionIdx] = {start: targetRegion.start, end: targetRegion.end, groupID: groupID}
    if (curCol >= indexedRegions.length - 1) {
        return indexedRegions
    }
    const nextOverlapIdx = findMaxOverlap(indexedRegions[curCol][regionIdx], indexedRegions[curCol+1])
    if (nextOverlapIdx === -1) {
        return indexedRegions
    }
    return assignOverlap(indexedRegions, curCol + 1, nextOverlapIdx, groupID)
}

// Continue grouping every region that has not yet been assigned a group.
const singleOverlap = (origIndexedRegions) => {
    var indexedRegions = origIndexedRegions
    var curGroupID = 0
    for (var i = 0; i < indexedRegions.length; i++) {
        for (var j = 0; j < indexedRegions[i].length; j++) {
            if (indexedRegions[i][j].groupID === -1) {
                indexedRegions = assignOverlap(indexedRegions, i, j, curGroupID)
                curGroupID++
            }
        }
    }
    return indexedRegions
}

const findGroup = (indexedRegions, groupID) => {
    var group = []
    indexedRegions.forEach((regions, x) => {
        regions.forEach((region, i) => {
            if (region.groupID === groupID) {
                if (x === 0) {
                    group.push({x: -0.5, start: region.start, end: region.end})
                }
                group.push({x: x, start: region.start, end: region.end})
                if (x === region.length - 1) {
                    group.push({x: region.length + 0.5, start: region.start, end: region.end})
                }
            }
        })
    })
    return group
}

const groupRegions = (indexedRegions) => {
    const groups = []
    var curGroupID = 0
    // Keep incrementing curGroupID until we can't find any more.
    while (true) {
        const group = findGroup(indexedRegions, curGroupID)
        if (group.length === 0) {
            break
        }
        groups.push(group)
        curGroupID++
    }
    return groups
}

// Given a logical set of groups, convert them to points to render.
const groupToPoints = (group) => {
    const points = []
    // Go through the points forwards and grab the start.
    group.forEach((region) => {
        points.push({x: region.x, y: region.start})
    })
    // Go through the points backwards and grab the ends.
    group.slice().reverse().forEach((region) => {
        points.push({x: region.x, y: region.end})
    })
    points.push({x: group[0].x, y: group[0].start})
    return points
}

// Given a set of points in the unit interval, expand
// them based on x and y scaling functions.
const pointsToAbs = (points, xConv, yConv) => {
    return points.map((p) => {return {x: xConv(p.x), y: yConv(p.y)}})
}


// Find point groups that would have width 0 and
// allow them to be visible.
const widenSingleGroups = (points) => {
    if (points.length !== 3) {
        return points
    }

    const ovalWidth = 0.04
    const left = points[0].x - ovalWidth
    const right = points[0].x + ovalWidth
    const top = points[0].y
    const bottom = points[1].y
    const newPoints = [
        {x: left, y: top},
        {x: right, y: top},
        {x: right, y: bottom},
        {x: left, y: bottom},
        {x: left, y: top},
    ]
    return newPoints
}

// Put everything together:
// - Find the invalid regions
// - Find the overlaps between the regions
// - Group the regions based on the overlaps
// - Convert them to points with which we can draw bezier curves
// - Widen the single groups
// - Scale the points from the unit interval.
const GetInvalidRegions = (colors, colorMaker, xConv, yConv) => {
    const invalidRegions = findInvalidRegions(colors, colorMaker)
    const overlaps = singleOverlap(invalidRegions)
    const groups = groupRegions(overlaps)
    const regions = groups.map(groupToPoints)
          .map(widenSingleGroups)
          .map((region) => {return pointsToAbs(region, xConv, yConv)})
    return regions
}

export default GetInvalidRegions;
