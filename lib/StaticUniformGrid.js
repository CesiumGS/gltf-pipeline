'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var triangleAxisAlignedBoundingBoxOverlap = require('./triangleAxisAlignedBoundingBoxOverlap');

var AxisAlignedBoundingBox = Cesium.AxisAlignedBoundingBox;
var Cartesian3 = Cesium.Cartesian3;

module.exports = StaticUniformGrid;

var minScratch = new Cartesian3();
var maxScratch = new Cartesian3();
var halfDimensionsScratch = new Cartesian3();

/**
 * A Uniform Grid for unmoving items.
 * @alias StaticUniformGrid
 * @private
 * @constructor
 *
 * @param {Object[]} items Items that the grid should store.
 * @param {Number} cellWidth The cell width of the uniform grid.
 * @param {StaticUniformGrid~CompareItemBoundingBox} compareItemBoundingBox
 * @param {StaticUniformGrid~CellCheckFunction} cellCheck
 */
function StaticUniformGrid(items, cellWidth, compareItemBoundingBox, cellCheck) {
    /**
     * The width of a single cell.
     * @type {Number}
     */
    this._cellWidth = cellWidth;

    /**
     * The inverse of the width of a single cell.
     * @type {Number}
     */
    this._inverseCellWidth = 1.0 / cellWidth;

    minScratch.x = Number.POSITIVE_INFINITY;
    minScratch.y = Number.POSITIVE_INFINITY;
    minScratch.z = Number.POSITIVE_INFINITY;
    maxScratch.x = Number.NEGATIVE_INFINITY;
    maxScratch.y = Number.NEGATIVE_INFINITY;
    maxScratch.z = Number.NEGATIVE_INFINITY;

    /**
     * The axis aligned bounding box of the grid
     * @type {AxisAlignedBoundingBox}
     */
    this._axisAlignedBoundingBox = new AxisAlignedBoundingBox(minScratch, maxScratch);

    /**
     * The cell count in each dimension.
     * @type {Cartesian3}
     */
    this._resolution = new Cartesian3();

    /**
     * Start index for each cell's items within the items array.
     * @type {Number[]}
     */
    this._cellIndices = [];

    /**
     * Count for each cell's items within the items array.
     * @type {Number[]}
     */
    this._cellCounts = [];

    /**
     * Array of items
     * @type {Array}
     */
    this._items = [];

    ////// Populate //////
    var min = this._axisAlignedBoundingBox.minimum;
    var max = this._axisAlignedBoundingBox.maximum;
    var center = this._axisAlignedBoundingBox.center;

    var resolution = this._resolution;

    // Find the min/max bounds and resolution of the uniform grid
    var itemsCount = items.length;
    var i;
    for (i = 0; i < itemsCount; ++i) {
        compareItemBoundingBox(items[i], min, max);
    }

    var inverseCellWidth = this._inverseCellWidth;
    // Figure out what the grid's resolution should be. Pad min and max out to match
    resolution.x = Math.floor((max.x - min.x) * inverseCellWidth) + 1;
    resolution.y = Math.floor((max.y - min.y) * inverseCellWidth) + 1;
    resolution.z = Math.floor((max.z - min.z) * inverseCellWidth) + 1;

    center = Cartesian3.add(min, max, center);
    center = Cartesian3.divideByScalar(center, 2.0, center);

    halfDimensionsScratch.x = (resolution.x * 0.5) * cellWidth;
    halfDimensionsScratch.y = (resolution.y * 0.5) * cellWidth;
    halfDimensionsScratch.z = (resolution.z * 0.5) * cellWidth;

    this._axisAlignedBoundingBox.minimum = Cartesian3.subtract(center, halfDimensionsScratch, min);
    this._axisAlignedBoundingBox.maximum = Cartesian3.add(center, halfDimensionsScratch, max);

    var cellCount = resolution.x * resolution.y * resolution.z;

    // Bin the items
    var cellBuckets = [];
    for (i = 0; i < cellCount; ++i) {
        cellBuckets.push(new CellBucket());
    }

    var parameters = new BinningParameters(cellBuckets, cellCheck, this);

    //For each item:
    for (i = 0; i < itemsCount; ++i) {
        var item = items[i];

        // Get the item's own axis aligned bounding box
        minScratch.x = Number.POSITIVE_INFINITY;
        minScratch.y = Number.POSITIVE_INFINITY;
        minScratch.z = Number.POSITIVE_INFINITY;
        maxScratch.x = Number.NEGATIVE_INFINITY;
        maxScratch.y = Number.NEGATIVE_INFINITY;
        maxScratch.z = Number.NEGATIVE_INFINITY;
        compareItemBoundingBox(item, minScratch, maxScratch);

        // Step over the cells touched by the item's axis aligned bounding box,
        // checking for each cell if the item intersects this cell.
        parameters.item = item;
        StaticUniformGrid.boundingBoxMarch(this, minScratch, maxScratch, binItem, parameters);
    }

    // Store copies of all the items in a contiguous array for slightly better spatial locality
    // Truly "better" locality might be achievable with something like a space filling curve.
    // See AO Roadmap: https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/125
    var allCellItems = this._items;
    var allCellIndices = this._cellIndices;
    var allCellCounts = this._cellCounts;

    var firstFreeIndex = 0;
    for (i = 0; i < cellCount; ++i) {
        var cellBucket = cellBuckets[i];
        var itemCount = cellBucket.itemCount;
        var cellItems = cellBucket.items;
        if (itemCount > 0) {
            allCellIndices.push(firstFreeIndex);
        } else {
            allCellIndices.push(-1);
        }
        allCellCounts.push(itemCount);
        firstFreeIndex += itemCount;
        for (var j = 0; j < itemCount; ++j) {
            allCellItems.push(clone(cellItems[j]));
        }
    }
}

Object.defineProperties(StaticUniformGrid.prototype, {
    /**
     * Gets the width of the uniform grid's cells.
     * @memberof StaticUniformGrid.prototype
     * @type {Number}
     */
    cellWidth : {
        get : function() {
            return this._cellWidth;
        }
    },
    /**
     * Gets the axis aligned bounding box around the grid.
     * @memberof StaticUniformGrid.prototype
     * @type {AxisAlignedBoundingBox}
     */
    axisAlignedBoundingBox : {
        get : function() {
            return this._axisAlignedBoundingBox;
        }
    },
    /**
     * Gets cell resolution in x, y, and z.
     * @memberof StaticUniformGrid.prototype
     * @type {Cartesian3}
     */
    resolution : {
        get : function() {
            return this._resolution;
        }
    },
    /**
     * Gets the list of indices at which each cell's items starts in the items array.
     * @memberof StaticUniformGrid.prototype
     * @type {Object[]}
     */
    cellIndices : {
        get : function() {
            return this._cellIndices;
        }
    },
    /**
     * Gets the list of lengths in the items array for each cell's items.
     * @memberof StaticUniformGrid.prototype
     * @type {Object[]}
     */
    cellCounts : {
        get : function() {
            return this._cellCounts;
        }
    },
    /**
     * Gets the items array that all the geometry/spatial items is stored in.
     * @memberof StaticUniformGrid.prototype
     * @type {Object[]}
     */
    items : {
        get : function() {
            return this._items;
        }
    }
});

function CellBucket() {
    this.itemCount = 0;
    this.items = [];
}

function BinningParameters(cellBuckets, cellCheckFunction, grid) {
    this.cellBuckets = cellBuckets;
    this.cellCheckFunction = cellCheckFunction;
    this.grid = grid;
    this.item = {};
}

var cellMarchScratch = new Cartesian3();
/**
 * Function for executing a function on each cell touched by an axis aligned bounding box within the uniform grid.
 *
 * @param {StaticUniformGrid} grid A StaticUniformGrid to be marched over
 * @param {Cartesian3} min The minimum coordinate of the bounding box to be "marched" over.
 * @param {Cartesian3} max The maximum coordinate of the bounding box to be "marched" over.
 * @param {Function} marchFunction A function to apply at each cell. The function should expect as inputs its parameters, the cell's minimum coordinate, and the cell width.
 * @param {Object} parameters Parameters for the marchFunction
 */
StaticUniformGrid.boundingBoxMarch = function(grid, min, max, marchFunction, parameters) {
    var inverseCellWidth = grid._inverseCellWidth;
    var cellWidth = grid._cellWidth;
    var gridMin = grid._axisAlignedBoundingBox.minimum;

    // Compute the minimum coordinate of the first cell
    var xStart = Math.floor((min.x - gridMin.x) * inverseCellWidth) * cellWidth + gridMin.x;
    var yStart = Math.floor((min.y - gridMin.y) * inverseCellWidth) * cellWidth + gridMin.y;
    cellMarchScratch.z = Math.floor((min.z - gridMin.z) * inverseCellWidth) * cellWidth + gridMin.z;

    // Compute the number of cells that min and max cover in each dimension.
    var xCount = Math.floor((max.x - min.x) * inverseCellWidth) + 1;
    var yCount = Math.floor((max.y - min.y) * inverseCellWidth) + 1;
    var zCount = Math.floor((max.z - min.z) * inverseCellWidth) + 1;

    // March over the cells that the grid covers.
    for (var z = 0; z < zCount; ++z) {
        cellMarchScratch.y = yStart;
        for (var y = 0; y < yCount; ++y) {
            cellMarchScratch.x = xStart;
            for (var x = 0; x < xCount; ++x) {
                marchFunction(parameters, cellMarchScratch, cellWidth);
                cellMarchScratch.x += cellWidth;
            }
            cellMarchScratch.y += cellWidth;
        }
        cellMarchScratch.z += cellWidth;
    }
};

function index3DTo1D(x, y, z, resolution){
    return x + y * resolution.x + z * resolution.x * resolution.y;
}

StaticUniformGrid.indexOfPosition = function(grid, position) {
    var min = grid._axisAlignedBoundingBox.minimum;
    var inverseCellWidth = grid._inverseCellWidth;
    var x = Math.floor((position.x - min.x) * inverseCellWidth);
    var y = Math.floor((position.y - min.y) * inverseCellWidth);
    var z = Math.floor((position.z - min.z) * inverseCellWidth);
    return index3DTo1D(x, y, z, grid._resolution);
};

var binItemScratch = new Cartesian3();
function binItem(parameters, corner, stepWidth) {
    var item = parameters.item;
    var cellCheckFunction = parameters.cellCheckFunction;

    // Check if this item overlaps the cell. If not, return.
    if (!cellCheckFunction(item, corner, stepWidth)) {
        return;
    }

    // Bin
    binItemScratch.x = corner.x + stepWidth * 0.5;
    binItemScratch.y = corner.y + stepWidth * 0.5;
    binItemScratch.z = corner.z + stepWidth * 0.5;

    var index = StaticUniformGrid.indexOfPosition(parameters.grid, binItemScratch);
    var cellItems = parameters.cellBuckets[index];
    ++cellItems.itemCount;
    cellItems.items.push(item);
}

/**
 * Function for executing a function on each cell neighboring the cell that encloses a position, constrained to
 * those neighbors within an octant.
 *
 * @param {StaticUniformGrid} grid A StaticUniformGrid to be marched over
 * @param {Cartesian3} position The coordinate that specifies the center cell.
 * @param {Cartesian3} direction The direction specifying the octant to check.
 * @param {Function} neighborFunction A function to apply at each neighbor cell. The function should expect as inputs a list of cell items and its parameters
 * @param {Object} parameters Parameters for the neighborFunction
 */
StaticUniformGrid.forNeighborsOctant = function(grid, position, direction, neighborFunction, parameters) {
    var min = grid._axisAlignedBoundingBox.minimum;
    var inverseCellWidth = grid._inverseCellWidth;
    var resolution = grid._resolution;

    var octantX = direction.x > 0.0 ? 1 : -1;
    var octantY = direction.y > 0.0 ? 1 : -1;
    var octantZ = direction.z > 0.0 ? 1 : -1;

    var xMid = Math.floor((position.x - min.x) * inverseCellWidth);
    var yMid = Math.floor((position.y - min.y) * inverseCellWidth);
    var zMid = Math.floor((position.z - min.z) * inverseCellWidth);

    var xStart = Math.max(Math.min(xMid, xMid + octantX), 0);
    var yStart = Math.max(Math.min(yMid, yMid + octantY), 0);
    var zStart = Math.max(Math.min(zMid, zMid + octantZ), 0);

    var xEnd = Math.min(Math.max(xMid + 1, xMid + octantX + 1), resolution.x);
    var yEnd = Math.min(Math.max(yMid + 1, yMid + octantY + 1), resolution.y);
    var zEnd = Math.min(Math.max(zMid + 1, zMid + octantZ + 1), resolution.z);

    var cellIndex = 0;
    var itemsIndex = -1;
    var itemsCount = -1;

    // Stored items are indexed so items in cells along the x axis are contiguous
    for (var z = zStart; z < zEnd; ++z) {
        for (var y = yStart; y < yEnd; ++y) {
            for (var x = xStart; x < xEnd; ++x) {
                cellIndex = index3DTo1D(x, y, z, resolution);
                itemsIndex = grid._cellIndices[cellIndex];
                itemsCount = grid._cellCounts[cellIndex];
                for (var i = 0; i < itemsCount; ++i) {
                    if (neighborFunction(grid._items[itemsIndex], parameters)) {
                        return;
                    }
                    ++itemsIndex;
                }
            }
        }
    }
};

/**
 * Function for executing a function on each cell neighboring the cell that encloses a position.
 *
 * @param {StaticUniformGrid} grid A StaticUniformGrid to be marched over
 * @param {Cartesian3} position The coordinate that specifies the center cell.
 * @param {Function} neighborFunction A function to apply at each neighbor cell. The function should expect as inputs a list of cell items and its parameters
 * @param {Object} parameters Parameters for the neighborFunction
 */
StaticUniformGrid.forEachNeighbor = function(grid, position, neighborFunction, parameters) {
    var min = grid._axisAlignedBoundingBox.minimum;
    var inverseCellWidth = grid._inverseCellWidth;
    var resolution = grid._resolution;

    var xMid = Math.floor((position.x - min.x) * inverseCellWidth);
    var yMid = Math.floor((position.y - min.y) * inverseCellWidth);
    var zMid = Math.floor((position.z - min.z) * inverseCellWidth);

    var xStart = Math.max(xMid - 1, 0);
    var yStart = Math.max(yMid - 1, 0);
    var zStart = Math.max(zMid - 1, 0);

    var xEnd = Math.min(xMid + 2, resolution.x);
    var yEnd = Math.min(yMid + 2, resolution.y);
    var zEnd = Math.min(zMid + 2, resolution.z);

    var cellIndex = 0;
    var itemsIndex = -1;
    var itemsCount = -1;

    // Stored items are indexed so items in cells along the x axis are contiguous
    for (var z = zStart; z < zEnd; ++z) {
        for (var y = yStart; y < yEnd; ++y) {
            for (var x = xStart; x < xEnd; ++x) {
                cellIndex = index3DTo1D(x, y, z, resolution);
                itemsIndex = grid._cellIndices[cellIndex];
                itemsCount = grid._cellCounts[cellIndex];
                for (var i = 0; i < itemsCount; ++i) {
                    if (neighborFunction(grid._items[itemsIndex], parameters)) {
                        return;
                    }
                    ++itemsIndex;
                }
            }
        }
    }
};

/**
 * Function for generating a uniform grid from a list of triangles of form [Cartesian3, Cartesian3, Cartesian3]
 *
 * @param {Object[]} items Triangle items to bin. Each triangle should be of form [Cartesian3, Cartesian3, Cartesian3]
 * @param {Number} cellWidth The width of each cell in the uniform grid.
 *
 * @returns {StaticUniformGrid} a new StaticUniformGrid storing triangles.
 */
StaticUniformGrid.fromTriangleSoup = function(items, cellWidth) {
    return new StaticUniformGrid(items, cellWidth, triangleAxisAlignedBoundingBox, triangleCellCheck);
};

function triangleAxisAlignedBoundingBox(triangle, min, max) {
    min.x = Math.min(triangle[0].x, min.x);
    min.y = Math.min(triangle[0].y, min.y);
    min.z = Math.min(triangle[0].z, min.z);
    max.x = Math.max(triangle[0].x, max.x);
    max.y = Math.max(triangle[0].y, max.y);
    max.z = Math.max(triangle[0].z, max.z);

    min.x = Math.min(triangle[1].x, min.x);
    min.y = Math.min(triangle[1].y, min.y);
    min.z = Math.min(triangle[1].z, min.z);
    max.x = Math.max(triangle[1].x, max.x);
    max.y = Math.max(triangle[1].y, max.y);
    max.z = Math.max(triangle[1].z, max.z);

    min.x = Math.min(triangle[2].x, min.x);
    min.y = Math.min(triangle[2].y, min.y);
    min.z = Math.min(triangle[2].z, min.z);
    max.x = Math.max(triangle[2].x, max.x);
    max.y = Math.max(triangle[2].y, max.y);
    max.z = Math.max(triangle[2].z, max.z);
}

var axisAlignedBoundingBoxScratch = new AxisAlignedBoundingBox();
function triangleCellCheck(triangle, cellMin, cellWidth) {
    var halfWidth = cellWidth * 0.5;
    var center = axisAlignedBoundingBoxScratch.center;
    var maximum = axisAlignedBoundingBoxScratch.maximum;

    halfDimensionsScratch.x = halfWidth;
    halfDimensionsScratch.y = halfWidth;
    halfDimensionsScratch.z = halfWidth;

    axisAlignedBoundingBoxScratch.minimum = cellMin;
    axisAlignedBoundingBoxScratch.center = Cartesian3.add(cellMin, halfDimensionsScratch, center);
    axisAlignedBoundingBoxScratch.maximum = Cartesian3.add(center, halfDimensionsScratch, maximum);

    return triangleAxisAlignedBoundingBoxOverlap(axisAlignedBoundingBoxScratch, triangle);
}

/**
 * A function that computes an axis aligned bounding box for some type of geometry or other spatial items and
 * compares this bounding box to the one passed in, returning the max and min that cover both in place.
 * @callback StaticUniformGrid~CompareItemBoundingBox
 *
 * @param {Cartesian3} min The callback function should modify min in place to cover its bounding box.
 * @param {Cartesian3} max The callback function should modify max in place to cover its bounding box.
 */

/**
 * A function that checks whether or not some type of geometry or other spatial items intersects a uniform grid cell.
 * @callback StaticUniformGrid~CellCheckFunction
 *
 * @param {Object} item An item that should be checked against.
 * @param {Cartesian3} corner The minimum corner of the cell.
 * @param {Number} stepWidth The cell width. Uniform in all 3 directions.
 *
 * @returns {Boolean} True if the item intersects the cell, false otherwise.
 */
