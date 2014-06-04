define([
  'angular',
  'config',
  'underscore',
],
function (angular, config, _) {
  "use strict";

  var module = angular.module('kibana.controllers');

  module.controller('DashProviderCtrl', function($scope, alertSrv, $location) {
    $scope.init = function() {
      // Check if browser supports localstorage, and if there's an old dashboard. If there is,
      // inform the user that they should save their dashboard to Elasticsearch and then set that
      // as their default
      if (Modernizr.localstorage) {
        if(!(_.isUndefined(window.localStorage['dashboard'])) && window.localStorage['dashboard'] !== '') {
          $location.path(config.default_route);
          alertSrv.set('Saving to browser storage has been replaced',' with saving to Elasticsearch.'+
            ' Click <a href="#/dashboard/local/deprecated">here</a> to load your old dashboard anyway.');
        } else if(!(_.isUndefined(window.localStorage.grafanaDashboardDefault))) {
          $location.path(window.localStorage.grafanaDashboardDefault);
        } else {
          $location.path(config.default_route);
        }
      // No? Ok, grab the default route, its all we have now
      } else {
        $location.path(config.default_route);
      }
    };

    $scope.init();
    
  });
});
