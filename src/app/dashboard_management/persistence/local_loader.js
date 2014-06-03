define([
  'angular',
  'jquery',
  'config',
  'underscore',
  'services/all',
  'dashboard_management/all'
],
function( angular, $, config, _ ) {
  "use strict";
  var module = angular.module( 'grafana.dashboard_management.persistence' );
  module.config( function( $routeProvider ) {
    $routeProvider      
      .when( '/dashboard/local', {
        templateUrl: 'app/partials/generic_dashboard.html',
        controller : 'DashFromLocalProvider',
      });
  });
  module.controller( "DashFromLocalProvider",
                     [ '$scope', '$routeParams', 'alertSrv', '$http', 'commonPostDashboardLoadSteps', 
                       function( $scope, $routeParams, alertSrv, $http, commonPostDashboardLoadSteps ) {
    $scope.init = function() {
        commonPostDashboardLoadSteps.finalize_load( $scope )(local_load());
    };

    var local_load = function( output_dashboard ) {
      var dashboard = JSON.parse(window.localStorage['dashboard']);
      dashboard.rows.unshift({
        height: "30",
        title: "Deprecation Notice",
        panels: [
          {
            title: 'WARNING: Legacy dashboard',
            type: 'text',
            span: 12,
            mode: 'html',
            content: 'This dashboard has been loaded from the browsers local cache. If you use '+
            'another brower or computer you will not be able to access it! '+
            '\n\n  <h4>Good news!</h4> Kibana'+
            ' now stores saved dashboards in Elasticsearch. Click the <i class="icon-save"></i> '+
            'button in the top left to save this dashboard. Then select "Set as Home" from'+
            ' the "advanced" sub menu to automatically use the stored dashboard as your Kibana '+
            'landing page afterwards'+
            '<br><br><strong>Tip:</strong> You may with to remove this row before saving!'
          }
        ]
      });
      return dashboard;
    };
    $scope.init();
  }]);
});
