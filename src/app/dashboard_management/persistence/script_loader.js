define([
  'angular',
  'kbn',
  'jquery',
  'config',
  'underscore',
  'services/all',
  'dashboard_management/all'
],
function( angular, kbn, $, config, _ ) {
  "use strict";
  var module = angular.module( 'grafana.dashboard_management.persistence' );
  module.config( function( $routeProvider ) {
    $routeProvider      
      .when( '/dashboard/script/:kbnId', {
        templateUrl: 'app/partials/generic_dashboard.html',
        controller : 'DashFromScriptProvider',
      });
  });
  module.controller( "DashFromScriptProvider",
                     [ '$scope', '$routeParams', 'alertSrv', '$http', 'commonPostDashboardLoadSteps', 
                       function( $scope, $routeParams, alertSrv, $http, commonPostDashboardLoadSteps ) {
    $scope.init = function() {
      script_load( $routeParams.kbnId )
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

    
    var script_load = function(file) {
      return $http({
        url: "app/dashboards/"+file.replace(/\.(?!js)/,"/"),
        method: "GET"
      })
      .then(function(result) {
        /*jshint -W054 */
        var script_func = new Function('ARGS','kbn','_','moment','window','document','$','jQuery', result.data);
        var script_result = script_func($routeParams,kbn,_,moment, window, document, $, $);

        // Handle async dashboard scripts
        if (_.isFunction(script_result)) {
          var deferred = $q.defer();
          script_result(function(dashboard) {
            $rootScope.$apply(function() {
              deferred.resolve({ data: dashboard });
            });
          });
          return deferred.promise;
        }

        return { data: script_result };
      })
      .then(function(result) {
        if(!result) {
          return false;
        }
        return result.data;
      },function() {
        alertSrv.set('Error',
          "Could not load <i>scripts/"+file+"</i>. Please make sure it exists and returns a valid dashboard" ,
          'error');
        return false;
      });
    };

    $scope.init();
  }]);
});
