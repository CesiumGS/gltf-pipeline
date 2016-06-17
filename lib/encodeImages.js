'use strict';
var Jimp = require('jimp');

module.exports = encodeImages;
var async = require('async');

function encodeImages(gltfWithExtras, callback) {
    var images = gltfWithExtras.images;
    var imageIDs = Object.keys(images);
    async.each(imageIDs, function(imageID, asyncCallback){
        if (images.hasOwnProperty(imageID)) {
            var image = images[imageID];
            var pipelineExtras = image.extras._pipeline;

            if (pipelineExtras.imageChanged) {
                // re-encode the jimp image here to a buffer that can be put in source
                var mime;
                switch(pipelineExtras.extension) {
                    case '.png':
                        mime = Jimp.MIME_PNG;
                        break;
                    case '.jpeg':
                        mime = Jimp.MIME_JPEG;
                        break;
                    case '.jpg':
                        mime = Jimp.MIME_JPEG;
                        break;
                    case '.bmp':
                        mime = Jimp.MIME_BMP;
                        break;
                }

                pipelineExtras.jimpImage.getBuffer(mime, function(err, imageBuffer) {
                    if (err) {
                        throw err;
                    }
                    pipelineExtras.source = imageBuffer;
                    asyncCallback();
                });
            }
            else {
                asyncCallback();
            }
        }
    }, function(err) {
        if (err) {
            if (callback) {
                callback(err);
            }
            else{
                throw err;
            }
        }
        else if (callback) {
            callback(gltfWithExtras);
        }
    });
}
