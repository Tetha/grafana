/** @scratch /index/0
 * = Kibana
 *
 * // Why can't I have a preamble here?
 *
 * == Introduction
 *
 * Kibana is an open source (Apache Licensed), browser based analytics and search dashboard for
 * ElasticSearch. Kibana is a snap to setup and start using. Written entirely in HTML and Javascript
 * it requires only a plain webserver, Kibana requires no fancy server side components.
 * Kibana strives to be easy to get started with, while also being flexible and powerful, just like
 * Elasticsearch.
 *
 * include::configuration/config.js.asciidoc[]
 *
 * include::panels.asciidoc[]
 *
 */

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

  module.controller('DashCtrl', function(
    $scope, $rootScope, $timeout, ejsResource, dashboard, filterSrv, dashboardKeybindings,
    alertSrv, panelMove, keyboardManager, grafanaVersion) {

    $scope.requiredElasticSearchVersion = ">=0.90.3";

    $scope.grafanaVersion = grafanaVersion[0] === '@' ? 'master' : grafanaVersion;

    // For moving stuff around the dashboard.
    $scope.panelMoveDrop = panelMove.onDrop;
    $scope.panelMoveStart = panelMove.onStart;
    $scope.panelMoveStop = panelMove.onStop;
    $scope.panelMoveOver = panelMove.onOver;
    $scope.panelMoveOut = panelMove.onOut;


    $scope.init = function() {
      console.log( "DashCtrl.init() from scope ", $scope );
      $scope.config = config;
      // Make stuff, including underscore.js available to views
      $scope._ = _;
      $scope.dashAlerts = alertSrv;
      

      // Clear existing alerts
      alertSrv.clearAll();

      $scope.reset_row();

      $scope.ejs = ejsResource(config.elasticsearch, config.elasticsearchBasicAuth);

      $scope.bindKeyboardShortcuts();
    };

    $scope.bindKeyboardShortcuts = dashboardKeybindings.shortcuts;

    $scope.isPanel = function(obj) {
      if(!_.isNull(obj) && !_.isUndefined(obj) && !_.isUndefined(obj.type)) {
        return true;
      } else {
        return false;
      }
    };

    $scope.add_row = function(dash,row) {
      dash.rows.push(row);
    };

    $scope.reset_row = function() {
      $scope.row = {
        title: '',
        height: '150px',
        editable: true,
      };
    };

    $scope.row_style = function(row) {
      return { 'min-height': row.collapse ? '5px' : row.height };
    };


    // This is whoafully incomplete, but will do for now
    $scope.parse_error = function(data) {
      var _error = data.match("nested: (.*?);");
      return _.isNull(_error) ? data : _error[1];
    };

    $scope.colors = [
      "#7EB26D","#EAB839","#6ED0E0","#EF843C","#E24D42","#1F78C1","#BA43A9","#705DA0", //1
      "#508642","#CCA300","#447EBC","#C15C17","#890F02","#0A437C","#6D1F62","#584477", //2
      "#B7DBAB","#F4D598","#70DBED","#F9BA8F","#F29191","#82B5D8","#E5A8E2","#AEA2E0", //3
      "#629E51","#E5AC0E","#64B0C8","#E0752D","#BF1B00","#0A50A1","#962D82","#614D93", //4
      "#9AC48A","#F2C96D","#65C5DB","#F9934E","#EA6460","#5195CE","#D683CE","#806EB7", //5
      "#3F6833","#967302","#2F575E","#99440A","#58140C","#052B51","#511749","#3F2B5B", //6
      "#E0F9D7","#FCEACA","#CFFAFF","#F9E2D2","#FCE2DE","#BADFF4","#F9D9F9","#DEDAF7"  //7
    ];

    $scope.init();
  });
});
