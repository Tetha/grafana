/**
 * main app level module
 */
define([
  'angular',
  'jquery',
  'underscore',
  'require',
  'elasticjs',
  'bootstrap',
  'angular-sanitize',
  'angular-strap',
  'angular-dragdrop',
  'extend-jquery',
  'bindonce'
],
function (angular, $, _, appLevelRequire) {

  "use strict";

  var app = angular.module('kibana', []),
    // we will keep a reference to each module defined before boot, so that we can
    // go back and allow it to define new features later. Once we boot, this will be false
    pre_boot_modules = [],
    // these are the functions that we need to call to register different
    // features if we define them after boot time
    register_fns = {};

  // This stores the grafana version number
  app.constant('grafanaVersion',"@grafanaVersion@");

  // Use this for cache busting partials
  app.constant('cacheBust',"cache-bust="+Date.now());

  /**
   * Tells the application to watch the module, once bootstraping has completed
   * the modules controller, service, etc. functions will be overwritten to register directly
   * with this application.
   * @param  {[type]} module [description]
   * @return {[type]}        [description]
   */
  app.useModule = function (module) {
    if (pre_boot_modules) {
      pre_boot_modules.push(module);
    } else {
      _.extend(module, register_fns);
    }
    return module;
  };

  app.safeApply = function ($scope, fn) {
    switch($scope.$$phase) {
    case '$apply':
      // $digest hasn't started, we should be good
      $scope.$eval(fn);
      break;
    case '$digest':
      // waiting to $apply the changes
      setTimeout(function () { app.safeApply($scope, fn); }, 10);
      break;
    default:
      // clear to begin an $apply $$phase
      $scope.$apply(fn);
      break;
    }
  };

  app.config(function ($routeProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {

    $routeProvider
      .when('/dashboard', {
        templateUrl: 'app/partials/generic_dashboard.html',
        controller : 'DashProviderCtrl'
      })
      .when('/dashboard/local/:kbnId/:params', {
        templateUrl: 'app/partials/generic_dashboard.html',
        controller : 'DashProviderCtrl'
      })
      .when('/dashboard/script/:kbnId/:params', {
        templateUrl: 'app/partials/generic_dashboard.html',
        controller : 'DashProviderCtrl'
      })
      .otherwise({
        redirectTo: 'dashboard'
      });

    // this is how the internet told me to dynamically add modules :/
    register_fns.controller = $controllerProvider.register;
    register_fns.directive  = $compileProvider.directive;
    register_fns.factory    = $provide.factory;
    register_fns.service    = $provide.service;
    register_fns.filter     = $filterProvider.register;
  });

  var apps_deps = [
    'elasticjs.service',
    '$strap.directives',
    'ngSanitize',
    'ngDragDrop',
    'kibana',
    'pasvaz.bindonce',
    'grafana.dashboard_management',
    'grafana.dashboard_management.persistence'
  ];

  _.each('controllers directives factories services services.dashboard filters'.split(' '),
  function (type) {
    var module_name = 'kibana.'+type;
    // create the module
    app.useModule(angular.module(module_name, []));
    // push it into the apps dependencies
    apps_deps.push(module_name);
  });

  // TODO: check this
  angular.module( "grafana.dashboard_management", [] );
  angular.module( "grafana.dashboard_management.persistence", [] );

  app.panel_helpers = {
    partial: function (name) {
      return 'app/partials/'+name+'.html';
    }
  };

  // load the core components
  require([
    'controllers/all',
    'directives/all',
    'filters/all',
    'dashboard_management/persistence/all'
  ], function () {

    // bootstrap the app
    angular
      .element(document)
      .ready(function() {
        angular.bootstrap(document, apps_deps)
          .invoke(['$rootScope', function ($rootScope) {
            _.each(pre_boot_modules, function (module) {
              _.extend(module, register_fns);
            });
            pre_boot_modules = false;

            $rootScope.requireContext = appLevelRequire;
            $rootScope.require = function (deps, fn) {
              var $scope = this;
              $scope.requireContext(deps, function () {
                var deps = _.toArray(arguments);
                // Check that this is a valid scope.
                if($scope.$id) {
                  $scope.$apply(function () {
                    fn.apply($scope, deps);
                  });
                }
              });
            };
          }]);
      });
  });

  return app;
});
