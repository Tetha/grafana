define([
  'angular',
  'jquery',
  'config',
  'underscore',
  'services/all',
  'services/dashboard/all'
],
function (angular, $, config, _) {
  "use strict";

  var module = angular.module( 'kibana.controllers' );
  module.controller( "DashboardEditorCtrl", function( $scope ) {
    $scope.init = function() {
      $scope.editor = {
        index : 0
      };

      $scope.$watch("editor.index", function() {
        console.log( "index changed to ", $scope.editor.index );
      });
    };

    $scope.init();
  });
});
