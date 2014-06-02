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
      
    }
    $scope.init();
  });
});
