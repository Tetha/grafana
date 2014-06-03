define([
  'angular',
  'jquery',
  'kbn',
  'underscore',
  'config',
  'moment',
  'modernizr',
  'filesaver'
],
function (angular, $, kbn, _, config, moment, Modernizr) {
  'use strict';

  var module = angular.module('kibana.services');

  module.factory('dashboard', function(
    $http, $rootScope, $injector, $location, $timeout,
    ejsResource, timer, alertSrv, $q
  ) {
    // A hash of defaults to use when loading a dashboard

    var _dash = {
      title: "",
      tags: [],
      style: "dark",
      timezone: 'browser',
      editable: true,
      failover: false,
      panel_hints: true,
      rows: [],
      pulldowns: [ 
        { type: 'templating' },  
    // TODO: check if loaders can deal with this
        { type: 'annotations', enable : false },
        { type : 'filtering', enable : false }],
      nav: [ { type: 'timepicker' } ],
      services: {},
      loader: {
        save_gist: false,
        save_elasticsearch: true,
        save_local: true,
        save_default: true,
        save_temp: true,
        save_temp_ttl_enable: true,
        save_temp_ttl: '30d',
        load_gist: false,
        load_elasticsearch: true,
        load_elasticsearch_size: 20,
        load_local: false,
        hide: false
      },
      refresh: false
    };


    var result = angular.copy( _dash );

    result.full_refresh = function() {
      $rootScope.$broadcast('refresh');
    };


    result.set_default = function(route) {
      if (Modernizr.localstorage) {
        // Purge any old dashboards
        if(!_.isUndefined(window.localStorage['dashboard'])) {
          delete window.localStorage['dashboard'];
        }
        window.localStorage.grafanaDashboardDefault = route;
        return true;
      } else {
        return false;
      }
    };

    result.purge_default = function() {
      if (Modernizr.localstorage) {
        // Purge any old dashboards
        if(!_.isUndefined(window.localStorage['dashboard'])) {

          delete window.localStorage['dashboard'];
        }
        delete window.localStorage.grafanaDashboardDefault;
        return true;
      } else {
        return false;
      }
    };

    // TOFIX: Pretty sure this breaks when you're on a saved dashboard already
    result.share_link = function(title,type,id) {
      return {
        location  : window.location.href.replace(window.location.hash,""),
        type      : type,
        id        : id,
        link      : window.location.href.replace(window.location.hash,"")+"#dashboard/"+type+"/"+id,
        title     : title
      };
    };

    result.elasticsearch_delete = function(id) {
      return ejs.Document(config.grafana_index,'dashboard',id).doDelete(
        // Success
        function(result) {
          return result;
        },
        // Failure
        function() {
          return false;
        }
      );
    };

    result.elasticsearch_save = function(type,title,ttl) {
      // Clone object so we can modify it without influencing the existing obejct
      var save = _.clone(this);
      var id;

      // Change title on object clone
      if (type === 'dashboard') {
        id = save.title = _.isUndefined(title) ? this.title : title;
      }

      // Create request with id as title. Rethink this.
      var request = ejs.Document(config.grafana_index,type,id).source({
        user: 'guest',
        group: 'guest',
        title: save.title,
        tags: save.tags,
        dashboard: angular.toJson(save)
      });

      request = type === 'temp' && ttl ? request.ttl(ttl) : request;

      return request.doIndex(
        // Success
        function(result) {
          if(type === 'dashboard') {
            $location.path('/dashboard/elasticsearch/'+title);
          }
          return result;
        },
        // Failure
        function() {
          return false;
        }
      );
    };

    result.to_file = function() {
      var blob = new Blob([angular.toJson(this,true)], {type: "application/json;charset=utf-8"});
      // from filesaver.js
      window.saveAs(blob, this.title+"-"+new Date().getTime());
      return true;
    };

    this.gist_id = function(string) {
      if(this.is_gist(string)) {
        return string.match(gist_pattern)[0].replace(/.*\//, '');
      }
    };

    result.is_gist = function(string) {
      if(!_.isUndefined(string) && string !== '' && !_.isNull(string.match(gist_pattern))) {
        return string.match(gist_pattern).length > 0 ? true : false;
      } else {
        return false;
      }
    };

    result.save_gist = function(title,dashboard) {
      var save = _.clone(dashboard || this.current);
      save.title = title || this.current.title;
      return $http({
        url: "https://api.github.com/gists",
        method: "POST",
        data: {
          "description": save.title,
          "public": false,
          "files": {
            "kibana-dashboard.json": {
              "content": angular.toJson(save,true)
            }
          }
        }
      }).then(function(data) {
        return data.data.html_url;
      }, function() {
        return false;
      });
    };

    result.gist_list = function(id) {
      return $http.jsonp("https://api.github.com/gists/"+id+"?callback=JSON_CALLBACK"
      ).then(function(response) {
        var files = [];
        _.each(response.data.data.files,function(v) {
          try {
            var file = JSON.parse(v.content);
            files.push(file);
          } catch(e) {
            return false;
          }
        });
        return files;
      }, function() {
        return false;
      });
    };

    result.set_interval = function (interval) {
      this.refresh = interval;
      if(interval) {
        var _i = kbn.interval_to_ms(interval);
        timer.cancel(this.refresh_timer);
        var dashboard_reference = this;
        this.refresh_timer = timer.register($timeout(function() {
          dashboard_reference.set_interval(interval);
          dashboard_reference.full_refresh();
        },_i));
        this.full_refresh();
      } else {
        timer.cancel(this.refresh_timer);
      }
    };
    return result;
  });

});
