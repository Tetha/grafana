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

    // Shared Editor feature code - TODO: move
    $scope.edit_path = function(type) {
      var p = $scope.panel_path(type);
      if(p) {
        return p+'/editor.html';
      } else {
        return false;
      }
    };

    // Shared Editor feature code - TODO: move
    $scope.panel_path =function(type) {
      if(type) {
        return 'app/panels/'+type.replace(".","/");
      } else {
        return false;
      }
    };
    $scope.init();
  });
});
