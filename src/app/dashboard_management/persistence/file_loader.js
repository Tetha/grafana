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
      .when( '/dashboard/file/:kbnId', {
        templateUrl: 'app/partials/generic_dashboard.html',
        controller : 'DashFromFileProvider',
      });
  });
  module.controller( "DashFromFileProvider",
                     [ '$scope', '$routeParams', 'alertSrv', '$http', 'commonPostDashboardLoadSteps', 
                       function( $scope, $routeParams, alertSrv, $http, commonPostDashboardLoadSteps ) {
    $scope.init = function() {
      file_load( $routeParams.kbnId )
        .then( commonPostDashboardLoadSteps.finalize_load( $scope ));
    };

    // TODO: duplication with dashboard_provider and all future dashboard providers
    var renderTemplate = function(json,params) {
      var _r;
      _.templateSettings = {interpolate : /\{\{(.+?)\}\}/g};
      var template = _.template(json);
      var rendered = template({ARGS:params});
      try {
        _r = angular.fromJson(rendered);
      } catch(e) {
        _r = false;
      }
      return _r;
    };

    var file_load = function( file ) {
      return $http({
        url: "app/dashboards/"+file.replace(/\.(?!json)/,"/")+'?' + new Date().getTime(),
        method: "GET",
        transformResponse: function(response) {
          return renderTemplate(response,$routeParams);
        }
      }).then(function(result) {
        if(!result) {
          return false;
        }
        return result.data;
      },function() {
        alertSrv.set('Error',"Could not load <i>dashboards/"+file+"</i>. Please make sure it exists" ,'error');
        return false;
      });
    };
    $scope.init();
  }]);
});
