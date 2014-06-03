define([
  'angular',
  'jquery',
  'config',
  'underscore',
  'services/all',
  'services/dashboard/all',
  'dashboard_management/all'
],
function (angular, $, config, _) {
  "use strict";

  var module = angular.module('kibana.controllers');

  module.controller('DashProviderCtrl', function(
    $scope, $rootScope, $timeout, ejsResource, dashboard, filterSrv, dashboardKeybindings,
    alertSrv, panelMove, keyboardManager, grafanaVersion, timer, $routeParams, $http, commonPostDashboardLoadSteps) {

    $scope.init = function() {
      return actual_load( dashboard )
        .success(commonPostDashboardLoadSteps.finalize_load( $scope ));
    }

    // An elasticJS client to use
    var ejs = ejsResource(config.elasticsearch, config.elasticsearchBasicAuth);
    var gist_pattern = /(^\d{5,}$)|(^[a-z0-9]{10,}$)|(gist.github.com(\/*.*)\/[a-z0-9]{5,}\/*$)/;




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
      _.defaults( dashboard, output_dashboard );
      _.defaults( dashboard.loader, output_dashboard );
    };

    

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

    var script_load = function(output_dashboard, file) {
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
        _.defaults( result.data, output_dashboard );
        _.defaults( result.data.loader, output_dashboard.loader );
        return true;
      },function() {
        alertSrv.set('Error',
          "Could not load <i>scripts/"+file+"</i>. Please make sure it exists and returns a valid dashboard" ,
          'error');
        return false;
      });
    };

    // TODO
    var actual_load = function( output_dashboard ) {
      // Is there a dashboard type and id in the URL?
      if(!(_.isUndefined($routeParams.kbnType)) && !(_.isUndefined($routeParams.kbnId))) {
        var _type = $routeParams.kbnType;
        var _id = $routeParams.kbnId;

        switch(_type) {
        default:
          $location.path(config.default_route);
        }
      // No dashboard in the URL
      } else {
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
      }
    };

    $scope.init();
    
  });
});
