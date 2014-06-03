define([
  'angular',
  'jquery',
  'underscore',
  'services/all'
],
function( angular, $, _ ) {
  var module = angular.module('grafana.dashboard_management');

  module.service("commonPostDashboardLoadSteps", [ "$rootScope", "timer", "dashboard", function($rootScope, timer, dashboard) {
    this.finalize_load = function( $scope ) {
      return function( data ) {
        console.log( "callback in finalize_load", data );
        console.log( "dashboard in finalize load", dashboard );
        output_dashboard = _.defaults( data, dashboard );
        output_dashboard.loader = _.defaults( data.loader, dashboard.loader );
        $.map( data.pulldowns, function( loaded_pulldown ) {
            output_dashboard.pulldowns = _.reject( dashboard.services, function( default_pulldown ) { loaded_pulldown.type == default_pulldown.type } );
            output_dashboard.pulldowns.unshift( loaded_pulldown );
        });
        $scope.dashboard = output_dashboard;
        $rootScope.$broadcast( 'dashboard-loaded', output_dashboard );
      };
    }
    
  }]);
});
