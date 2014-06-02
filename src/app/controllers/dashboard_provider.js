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

  var module = angular.module('kibana.controllers');

  module.controller('DashProviderCtrl', function(
    $scope, $rootScope, $timeout, ejsResource, dashboard, filterSrv, dashboardKeybindings,
    alertSrv, panelMove, keyboardManager, grafanaVersion) {

    $scope.init = function() {
      console.log( "DashProviderCtrl.init for scope ", $scope );

      $scope.dashboard = dashboard;

      // TODO: does this really make sense here?
      $scope.filter = filterSrv;
      $scope.$watch('filter.time', function() {
          $scope.dashboard.refresh();
      }, true);
      $scope.filter.init( dashboard.current );

      $scope.$on('dashboard-loaded', function( event, new_dashboard ) {
        $scope.availablePanels = _.difference( config.panel_names,
          _.pluck( _.union( new_dashboard.nav, new_dashboard.pulldowns ), 'type' ) );
        $scope.availablePanels = _.difference( $scope.availablePanels, config.hidden_panels );
      });
      $scope.$watch('dashboard.current', function(newValue) {
          $scope.filter.init( newValue );
      });
    }

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

    // Panel Editor feature code - TODO: move
    $scope.setEditorTabs = function(panelMeta) {
      $scope.editorTabs = ['General','Panel'];
      if(!_.isUndefined(panelMeta.editorTabs)) {
        $scope.editorTabs =  _.union($scope.editorTabs,_.pluck(panelMeta.editorTabs,'title'));
      }
      return $scope.editorTabs;
    };
    $scope.init();
  });
});
