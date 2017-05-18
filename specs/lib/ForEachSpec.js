'use strict';
var ForEach = require('../../lib/ForEach');

describe('ForEach', function() {
   describe('object', function() {
       it('iterates over items in an array', function() {
           var array=  ['0', '1', '2', '3', '4', '5'];
           var count = 0;
           ForEach.object(array, function(value, index) {
               expect(index).toEqual(count);
               expect(value).toEqual('' + count);
               count++;
           });
           expect(count).toEqual(6);
       });

       it('adjusts iterator based on the returned value', function() {
           var array = [0, 1, 2, 3, 4, 5];
           var count = 0;
           ForEach.object(array, function() {
               count++;
               return 1;
           });
           expect(count).toEqual(3);
       });

       it('ends iteration early if handler returns true', function() {
           var array = [0, 1, 2, 3, 4, 5];
           var count = 0;
           ForEach.object(array, function(value) {
               if (value === 3) {
                   return true;
               }
               count++;
           });
           expect(count).toEqual(3);
       });
   });
});