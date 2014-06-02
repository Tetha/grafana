define([
  'angular',
  'app',
  'underscore'
],
function (angular, app, _) {
  'use strict';

  angular
    .module('kibana.directives')
    .directive('bodyClass', function() {
      return {
        link: function($scope, elem) {

          var lastPulldownVal;
          var lastHideControlsVal;

          $scope.$watch('playlist_active', function() {
            elem.toggleClass('hide-controls', $scope.playlist_active === true);
            elem.toggleClass('playlist-active', $scope.playlist_active === true);
          });
        }
      };
    });

});
