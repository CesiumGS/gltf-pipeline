'use strict';
var Cesium = require('cesium');
var clone = require('clone');
var combinePrimitives = require('../../lib/combinePrimitives');
var readAccessor = require('../../lib/readAccessor');

var WebGLConstants = Cesium.WebGLConstants;

describe('combinePrimitives', function() {
    var arrayOneA = new Float32Array([1, 2, 3]);
    var bufferOneA = new Buffer(arrayOneA.buffer);
    var arrayTwoA = new Float32Array([4, 5, 6]);
    var bufferTwoA = new Buffer(arrayTwoA.buffer);
    var arrayOneB = new Float32Array([1, 2, 3]);
    var arrayTwoB = new Float32Array([5, 6, 7, 8]);
    var bufferTwoB = new Buffer(arrayTwoB.buffer);

    it('combines two primitives without indices by concatenating them', function() {
        var buffer = Buffer.concat([bufferOneA, bufferTwoA]);
        var gltf = {
            accessors : {
                accessorOneA : {
                    bufferView : 'bufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : arrayOneA.length,
                    type : 'SCALAR'
                },
                accessorTwoA : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : arrayTwoA.length,
                    type : 'SCALAR'
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : buffer.length,
                    byteOffset : 0
                }
            },
            buffers : {
                buffer : {
                    byteLength : buffer.length,
                    extras : {
                        _pipeline : {
                            source : buffer
                        }
                    }
                }
            },
            meshes : {
                mesh : {
                    primitives : [{
                            attributes : {
                                A : 'accessorOneA'
                            },
                            extras : {
                                _pipeline : {}
                            }
                        }, {
                            attributes : {
                                A : 'accessorTwoA'
                            },
                            extras : {
                                _pipeline : {}
                            }
                        }]
                }
            }
        };
        combinePrimitives(gltf);
        var accessors = gltf.accessors;
        var primitives = gltf.meshes.mesh.primitives;
        expect(primitives.length).toEqual(1);
        var primitive = primitives[0];
        expect(primitive.indices).toBeDefined();
        var indices = [];
        readAccessor(gltf, accessors[primitive.indices], indices);
        expect(indices).toEqual([0, 1, 2, 3, 4, 5]);
        var attribute = [];
        readAccessor(gltf, accessors[primitive.attributes.A], attribute);
        expect(attribute).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('combines two primitives with indices by concatenating them', function() {
        var indicesOne = new Uint16Array([2, 0, 1]);
        var bufferIndicesOne = new Buffer(indicesOne.buffer);
        var indicesTwo = new Uint16Array([1, 2, 0]);
        var bufferIndicesTwo = new Buffer(indicesTwo.buffer);
        var buffer = Buffer.concat([bufferOneA, bufferTwoA, bufferIndicesOne, bufferIndicesTwo]);
        var gltf = {
            accessors : {
                accessorOneA : {
                    bufferView : 'bufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : arrayOneA.length,
                    type : 'SCALAR'
                },
                accessorTwoA : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : arrayTwoA.length,
                    type : 'SCALAR'
                },
                indicesOne : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length + bufferTwoA.length,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indicesOne.length,
                    type : 'SCALAR'
                },
                indicesTwo : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length + bufferTwoA.length + bufferIndicesOne.length,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indicesOne.length,
                    type : 'SCALAR'
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : buffer.length,
                    byteOffset : 0
                }
            },
            buffers : {
                buffer : {
                    byteLength : buffer.length,
                    extras : {
                        _pipeline : {
                            source : buffer
                        }
                    }
                }
            },
            meshes : {
                mesh : {
                    primitives : [{
                        attributes : {
                            A : 'accessorOneA'
                        },
                        indices : 'indicesOne',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'accessorTwoA'
                        },
                        indices : 'indicesTwo',
                        extras : {
                            _pipeline : {}
                        }
                    }]
                }
            }
        };
        combinePrimitives(gltf);
        var accessors = gltf.accessors;
        var primitives = gltf.meshes.mesh.primitives;
        expect(primitives.length).toEqual(1);
        var primitive = primitives[0];
        var indices = [];
        readAccessor(gltf, accessors[primitive.indices], indices);
        expect(indices).toEqual([2, 0, 1, 4, 5, 3]);
        var attribute = [];
        readAccessor(gltf, accessors[primitive.attributes.A], attribute);
        expect(attribute).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('combines two primitives with shared attribute accessors by merging them', function() {
        var indicesOne = new Uint16Array([0, 2]);
        var bufferIndicesOne = new Buffer(indicesOne.buffer);
        var indicesTwo = new Uint16Array([2, 1]);
        var bufferIndicesTwo = new Buffer(indicesTwo.buffer);
        var buffer = Buffer.concat([bufferOneA, bufferIndicesOne, bufferIndicesTwo]);
        var gltf = {
            accessors : {
                accessorOneA : {
                    bufferView : 'bufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : arrayOneA.length,
                    type : 'SCALAR'
                },
                indicesOne : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indicesOne.length,
                    type : 'SCALAR'
                },
                indicesTwo : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length + bufferIndicesOne.length,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indicesOne.length,
                    type : 'SCALAR'
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : buffer.length,
                    byteOffset : 0
                }
            },
            buffers : {
                buffer : {
                    byteLength : buffer.length,
                    extras : {
                        _pipeline : {
                            source : buffer
                        }
                    }
                }
            },
            meshes : {
                mesh : {
                    primitives : [{
                        attributes : {
                            A : 'accessorOneA'
                        },
                        indices : 'indicesOne',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'accessorOneA'
                        },
                        indices : 'indicesTwo',
                        extras : {
                            _pipeline : {}
                        }
                    }]
                }
            }
        };
        combinePrimitives(gltf);
        var accessors = gltf.accessors;
        var primitives = gltf.meshes.mesh.primitives;
        expect(primitives.length).toEqual(1);
        var primitive = primitives[0];
        var indices = [];
        readAccessor(gltf, accessors[primitive.indices], indices);
        expect(indices).toEqual([0, 2, 2, 1]);
        var attribute = [];
        readAccessor(gltf, accessors[primitive.attributes.A], attribute);
        expect(attribute).toEqual([1, 2, 3]);
    });

    it('combines three primitives, merging two and then concatenating the result with the third', function() {
        var indicesOne = new Uint16Array([0, 2]);
        var bufferIndicesOne = new Buffer(indicesOne.buffer);
        var indicesTwo = new Uint16Array([2, 1]);
        var bufferIndicesTwo = new Buffer(indicesTwo.buffer);
        var indicesThree = new Uint16Array([0, 1, 2, 3, 2, 1]);
        var bufferIndicesThree = new Buffer(indicesThree.buffer);
        var buffer = Buffer.concat([bufferOneA, bufferTwoB, bufferIndicesOne, bufferIndicesTwo, bufferIndicesThree]);
        var gltf = {
            accessors : {
                accessorOneA : {
                    bufferView : 'bufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : arrayOneA.length,
                    type : 'SCALAR'
                },
                accessorTwoB : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length,
                    byteStride : 0,
                    componentType : WebGLConstants.FLOAT,
                    count : arrayTwoB.length,
                    type : 'SCALAR'
                },
                indicesOne : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length + bufferTwoB.length,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indicesOne.length,
                    type : 'SCALAR'
                },
                indicesTwo : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length + bufferTwoB.length + bufferIndicesOne.length,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indicesTwo.length,
                    type : 'SCALAR'
                },
                indicesThree : {
                    bufferView : 'bufferView',
                    byteOffset : bufferOneA.length + bufferTwoB.length + bufferIndicesOne.length + bufferIndicesTwo.length,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : indicesThree.length,
                    type : 'SCALAR'
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : buffer.length,
                    byteOffset : 0
                }
            },
            buffers : {
                buffer : {
                    byteLength : buffer.length,
                    extras : {
                        _pipeline : {
                            source : buffer
                        }
                    }
                }
            },
            meshes : {
                mesh : {
                    primitives : [{
                        attributes : {
                            A : 'accessorOneA'
                        },
                        indices : 'indicesOne',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'accessorOneA'
                        },
                        indices : 'indicesTwo',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'accessorTwoB'
                        },
                        indices : 'indicesThree',
                        extras : {
                            _pipeline : {}
                        }
                    }]
                }
            }
        };
        combinePrimitives(gltf);
        var accessors = gltf.accessors;
        var primitives = gltf.meshes.mesh.primitives;
        expect(primitives.length).toEqual(1);
        var primitive = primitives[0];
        var indices = [];
        readAccessor(gltf, accessors[primitive.indices], indices);
        expect(indices).toEqual([0, 1, 2, 3, 2, 1, 4, 6, 6, 5]);
        var attribute = [];
        readAccessor(gltf, accessors[primitive.attributes.A], attribute);
        expect(attribute).toEqual([5, 6, 7, 8, 1, 2, 3]);
    });

    it('doesn\'t combine primitive that has attribute accessors that are different sizes', function() {
        var gltf = {
            accessors: {
                accessorOneA: {
                    componentType: WebGLConstants.FLOAT,
                    count: arrayOneA.length,
                    type: 'SCALAR'
                },
                accessorOneB: {
                    componentType: WebGLConstants.FLOAT,
                    count: arrayOneB.length,
                    type: 'SCALAR'
                },
                accessorTwoA: {
                    componentType: WebGLConstants.UNSIGNED_SHORT,
                    count: arrayTwoA.length,
                    type: 'SCALAR'
                },
                accessorTwoB: {
                    componentType: WebGLConstants.UNSIGNED_SHORT,
                    count: arrayTwoB.length,
                    type: 'SCALAR'
                }
            },
            meshes: {
                mesh: {
                    primitives: [{
                        attributes: {
                            A: 'accessorOneA',
                            B: 'accessorOneB'
                        },
                        extras: {
                            _pipeline: {}
                        }
                    }, {
                        attributes: {
                            A: 'accessorTwoA',
                            B: 'accessorTwoB'
                        },
                        extras: {
                            _pipeline: {}
                        }
                    }]
                }
            }
        };
        var originalGltf = clone(gltf);
        combinePrimitives(gltf);
        delete gltf.meshes.mesh.primitives[0].extras._pipeline.conflicts;
        delete gltf.meshes.mesh.primitives[1].extras._pipeline.conflicts;
        expect(gltf).toEqual(originalGltf);
    });

    it('doesn\'t combine primitives that share only a single attribute accessor', function() {
        var gltf = {
            accessors: {
                accessorOneA: {
                    componentType: WebGLConstants.FLOAT,
                    count: arrayOneA.length,
                    type: 'SCALAR'
                },
                accessorOneB: {
                    componentType: WebGLConstants.FLOAT,
                    count: arrayOneB.length,
                    type: 'SCALAR'
                },
                accessorTwoB: {
                    componentType: WebGLConstants.UNSIGNED_SHORT,
                    count: arrayTwoB.length,
                    type: 'SCALAR'
                }
            },
            meshes: {
                mesh: {
                    primitives: [{
                        attributes: {
                            A: 'accessorOneA',
                            B: 'accessorTwoB'
                        },
                        extras: {
                            _pipeline: {}
                        }
                    }, {
                        attributes: {
                            A: 'accessorOneA',
                            B: 'accessorOneB'
                        },
                        extras: {
                            _pipeline: {}
                        }
                    }]
                }
            }
        };
        var originalGltf = clone(gltf);
        combinePrimitives(gltf);
        delete gltf.meshes.mesh.primitives[0].extras._pipeline.conflicts;
        delete gltf.meshes.mesh.primitives[1].extras._pipeline.conflicts;
        expect(gltf).toEqual(originalGltf);
    });

    it('doesn\'t combine primitives with different materials', function() {
        var gltf = {
            meshes : {
                mesh: {
                    primitives: [{
                        material: 'materialOne',
                        extras: {
                            _pipeline: {}
                        }
                    }, {
                        material: 'materialTwo',
                        extras: {
                            _pipeline: {}
                        }
                    }]
                }
            }
        };
        var originalGltf = clone(gltf);
        combinePrimitives(gltf);
        delete gltf.meshes.mesh.primitives[0].extras._pipeline.conflicts;
        delete gltf.meshes.mesh.primitives[1].extras._pipeline.conflicts;
        expect(gltf).toEqual(originalGltf);
    });

    it('doesn\'t combine primitives with different modes', function() {
        var gltf = {
            meshes : {
                mesh: {
                    primitives: [{
                        mode: 0,
                        extras: {
                            _pipeline: {}
                        }
                    }, {
                        mode: 1,
                        extras: {
                            _pipeline: {}
                        }
                    }]
                }
            }
        };
        var originalGltf = clone(gltf);
        combinePrimitives(gltf);
        delete gltf.meshes.mesh.primitives[0].extras._pipeline.conflicts;
        delete gltf.meshes.mesh.primitives[1].extras._pipeline.conflicts;
        expect(gltf).toEqual(originalGltf);
    });

    it('doesn\'t combine primitives in a way that overflows uint16', function() {
        var valueCount = 16385;
        var smallerValueCount = 100;
        var quarterOverflow = new Uint16Array(valueCount);
        for (var i = 0; i < valueCount; i++) {
            quarterOverflow[i] = i;
        }
        var quarterOverflowBuffer = new Buffer(quarterOverflow.buffer);
        var quarterOverflowAccessor = {
            bufferView : 'bufferView',
            byteOffset : 0,
            byteStride : 0,
            componentType : WebGLConstants.UNSIGNED_SHORT,
            count : valueCount,
            type : 'SCALAR'
        };

        var gltf = {
            accessors : {
                dataA : quarterOverflowAccessor,
                dataB : quarterOverflowAccessor,
                dataC : quarterOverflowAccessor,
                dataD : quarterOverflowAccessor,
                dataE : quarterOverflowAccessor,
                dataF : {
                    bufferView : 'bufferView',
                    byteOffset : 0,
                    byteStride : 0,
                    componentType : WebGLConstants.UNSIGNED_SHORT,
                    count : smallerValueCount,
                    type : 'SCALAR'
                }
            },
            bufferViews : {
                bufferView : {
                    buffer : 'buffer',
                    byteLength : quarterOverflowBuffer.length,
                    byteOffset : 0
                }
            },
            buffers : {
                buffer : {
                    byteLength : quarterOverflowBuffer.length,
                    extras : {
                        _pipeline : {
                            source : quarterOverflowBuffer
                        }
                    }
                }
            },
            meshes : {
                mesh : {
                    primitives : [{
                        attributes : {
                            A : 'dataA'
                        },
                        indices : 'dataA',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'dataB'
                        },
                        indices : 'dataB',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'dataC'
                        },
                        indices : 'dataC',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'dataD'
                        },
                        indices : 'dataD',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'dataE'
                        },
                        indices : 'dataE',
                        extras : {
                            _pipeline : {}
                        }
                    }, {
                        attributes : {
                            A : 'dataF'
                        },
                        indices : 'dataF',
                        extras : {
                            _pipeline : {}
                        }
                    }]
                }
            }
        };
        combinePrimitives(gltf);

        var newPrimitives = gltf.meshes.mesh.primitives;
        expect(newPrimitives.length).toEqual(2);

        var primitive0 = newPrimitives[0];
        var primitive1 = newPrimitives[1];
        var newAccessors = gltf.accessors;

        var expectedNewAccessorLength1 = smallerValueCount + valueCount * 3;
        var expectedNewAccessorLength2 = valueCount * 2;
        expect(newAccessors[primitive0.indices].count).toEqual(expectedNewAccessorLength1);
        expect(newAccessors[primitive1.indices].count).toEqual(expectedNewAccessorLength2);

        // Check indices. Since indices for each primitive were monotonically increasing,
        // expect indices to match loop iteration indices.
        var indices = [];
        var indicesMatch = true;
        readAccessor(gltf, newAccessors[primitive0.indices], indices);
        for (i = 0; i < expectedNewAccessorLength1; i++) {
            indicesMatch = indicesMatch && indices[i] === i;
        }
        expect(indicesMatch).toBe(true);

        indices = [];
        indicesMatch = true;
        readAccessor(gltf, newAccessors[primitive1.indices], indices);
        for (i = 0; i < expectedNewAccessorLength2; i++) {
            indicesMatch = indicesMatch && indices[i] === i;
        }
        expect(indicesMatch).toBe(true);

        // Check attributes. Since attributes for each primitive were monotonically increasing,
        // this must be done in pieces.
        var attributes = [];
        var attributesMatch = true;
        readAccessor(gltf, newAccessors[primitive0.attributes.A], attributes);
        for (i = 0; i < smallerValueCount; i++) {
            attributesMatch = attributesMatch && attributes[i] === i;
        }
        for (i = 0; i < valueCount; i++) {
            attributesMatch = attributesMatch && attributes[i + smallerValueCount] === i;
        }
        for (i = 0; i < valueCount; i++) {
            attributesMatch = attributesMatch && attributes[i + smallerValueCount + valueCount] === i;
        }
        for (i = 0; i < valueCount; i++) {
            attributesMatch = attributesMatch && attributes[i + smallerValueCount + valueCount * 2] === i;
        }
        expect(attributesMatch).toBe(true);

        attributes = [];
        attributesMatch = true;
        readAccessor(gltf, newAccessors[primitive1.attributes.A], attributes);
        for (i = 0; i < valueCount; i++) {
            attributesMatch = attributesMatch && attributes[i] === i;
        }
        for (i = 0; i < valueCount; i++) {
            attributesMatch = attributesMatch && attributes[i + valueCount] === i;
        }
        expect(attributesMatch).toBe(true);
    });
});
