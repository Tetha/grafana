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
      .when( '/dashboard/elasticsearch/:kbnId', {
        templateUrl: 'app/partials/generic_dashboard.html',
        controller : 'DashFromElasticSearchProvider',
        resolve : { 'dashboardType' : function() { return 'dashboard'; } }
      })
      .when( '/dashboard/temp/:kbnId', {
        templateUrl: 'app/partials/generic_dashboard.html',
        controller : 'DashFromElasticSearchProvider',
        resolve : { 'dashboardType' : function() { return 'temp'; } }
      })
  });
  module.controller( "DashFromElasticSearchProvider",
                     [ '$scope', '$routeParams', 'alertSrv', '$http', 'dashboardType', 'commonPostDashboardLoadSteps', 
                       function( $scope, $routeParams, alertSrv, $http, dashboardType, commonPostDashboardLoadSteps ) {
                         console.log( dashboardType );
    $scope.init = function() {
      elasticsearch_load( dashboardType, $routeParams.kbnId )
        .success( commonPostDashboardLoadSteps.finalize_load( $scope ));
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

    var elasticsearch_load = function(type,id) {
      if ( undefined == type ) {
        // TODO: alertSrv
        console.error( "Unknown elasticsearch load type", type );
        return false;
      }
      console.log( "load: ", type, id );
      var options = {
        url: config.elasticsearch + "/" + config.grafana_index + "/"+type+"/"+id+'?' + new Date().getTime(),
        method: "GET",
        transformResponse: function(response) {
          return renderTemplate(angular.fromJson(response)._source.dashboard, $routeParams);
        }
      };
      if (config.elasticsearchBasicAuth) {
        options.withCredentials = true;
        options.headers = {
          "Authorization": "Basic " + config.elasticsearchBasicAuth
        };
      }
      return $http(options)
      .error(function(data, status) {
        if(status === 0) {
          alertSrv.set('Error',"Could not contact Elasticsearch at "+config.elasticsearch+
            ". Please ensure that Elasticsearch is reachable from your system." ,'error');
        } else {
          alertSrv.set('Error',"Could not find "+id+". If you"+
            " are using a proxy, ensure it is configured correctly",'error');
        }
        return false;
      });
    };
    $scope.init();
  }]);
});
