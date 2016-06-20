'use strict';
var Cesium = require('cesium');
var addCesiumRTC = require('../../lib/addCesiumRTC');

describe('addCesiumRTC', function() {
   it('adds glTF CESIUM_RTC extension', function() {
       var gltf = {
           techniques : {
               technique : {
                   parameters : {
                       modelViewMatrix : {
                           semantic : 'MODEL_VIEW_MATRIX'
                       }
                   }
               }
           }
       };
       addCesiumRTC(gltf, {
           latitude : 10.0,
           longitude : 20.0,
           height : 30.0
       });
       var rtc = gltf.extensions.CESIUM_RTC;
       expect(rtc).toBeDefined();
       expect(rtc.center).toBeDefined();
       expect(gltf.extensionsUsed.indexOf('CESIUM_RTC')).not.toBeLessThan(0);
       expect(gltf.techniques.technique.parameters.modelViewMatrix.semantic).toEqual('CESIUM_RTC_MODELVIEW');
   });
});