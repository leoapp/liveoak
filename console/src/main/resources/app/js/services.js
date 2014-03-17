'use strict';

var loMod = angular.module('loApp');

/* Services */
loMod.factory('Current', function($log, $q, $routeParams, LoAppList) {

  $log.debug('Current service');

  var current = {};
  var app = $q.defer();

  current.getCurrent = function() {
    LoAppList.get(function(data) {
      var appList = data._members;
      if ($routeParams.appId) {
        $log.debug('Looking for ' + $routeParams.appId);
        for (var i = 0; i < appList.length; i++) {
          if (appList[i].id === $routeParams.appId) {
            $log.debug('Current app found: ' + appList[i].id);
            current =  {id: appList[i].id, name: appList[i].name};
          }
        }
      }
      // If not found, fallback to the 1st app in the list
      if(!current) {
        current =  {id: appList[0].id, name: appList[0].name};
      }

      $log.debug('Resolving: ' + JSON.stringify(current));
      app.resolve(current);
    }, function(){
      $log.debug('Rejecting');
      app.reject('Unable to load current app.');
    });

    return app.promise;
  };

  return current;
});

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('loApp.services', []).
  value('version', '0.1');

angular.module('services.breadcrumbs', []);
angular.module('services.breadcrumbs').factory('breadcrumbs', ['$rootScope', '$location', function($rootScope, $location){

  var breadcrumbs = [];
  var breadcrumbsService = {};

  //we want to update breadcrumbs only when a route is actually changed
  //as $location.path() will get updated immediately (even if route change fails!)
  $rootScope.$on('$routeChangeSuccess', function(){

    var pathElements = $location.path().split('/'), result = [], i;
    var breadcrumbPath = function (index) {
      return '/' + (pathElements.slice(0, index + 1)).join('/');
    };

    pathElements.shift();
    for (i = 0; i < pathElements.length; i++) {
      result.push({name: pathElements[i], path: breadcrumbPath(i)});
    }

    breadcrumbs = result;
  });

  breadcrumbsService.getAll = function() {
    return breadcrumbs;
  };

  breadcrumbsService.getFirst = function() {
    return breadcrumbs[0] || {};
  };

  return breadcrumbsService;
}]);

loMod.factory('Notifications', function($rootScope, $timeout, $log) {
  // time (in ms) the notifications are shown
  var delay = 5000;

  var notifications = {};

  $rootScope.notifications = {};
  $rootScope.notifications.data = [];

  $rootScope.notifications.remove = function(index){
    $rootScope.notifications.data.splice(index,1);
  };

  var scheduleMessagePop = function() {
    $timeout(function() {
      $rootScope.notifications.data.splice(0,1);
    }, delay);
  };

  if (!$rootScope.notifications) {
    $rootScope.notifications.data = [];
  }

  notifications.message = function(type, header, message) {
    $rootScope.notifications.data.push({
      type : type,
      header: header,
      message : message
    });

    scheduleMessagePop();
  };

  notifications.info = function(message) {
    notifications.message('info', 'Info!', message);
    $log.info(message);
  };

  notifications.success = function(message) {
    notifications.message('success', 'Success!', message);
    $log.info(message);
  };

  notifications.error = function(message) {
    notifications.message('danger', 'Error!', message);
    $log.error(message);
  };

  notifications.warn = function(message) {
    notifications.message('warning', 'Warning!', message);
    $log.warn(message);
  };

  return notifications;
});

/* Loaders - Loaders are used in the route configuration as resolve parameters */
loMod.factory('Loader', function($q) {
  var loader = {};
  loader.get = function(service, id) {
    return function() {
      var i = id && id();
      var delay = $q.defer();
      service.get(i, function(entry) {
        delay.resolve(entry);
      }, function() {
        delay.reject('Unable to fetch ' + i);
      });
      return delay.promise;
    };
  };
  loader.query = function(service, id) {
    return function() {
      var i = id && id();
      var delay = $q.defer();
      service.query(i, function(entry) {
        delay.resolve(entry);
      }, function() {
        delay.reject('Unable to fetch ' + i);
      });
      return delay.promise;
    };
  };
  return loader;
});

loMod.factory('LoStorage', function($resource) {
  return $resource('/admin/applications/:appId/resources/:storageId', {
    appId : '@appId',
    storageId : '@storageId'
  }, {
    get : {
      method : 'GET'
    },
    create : {
      method : 'POST',
      params : { appId : '@appId'}
    },
    update : {
      method : 'PUT',
      params : { appId : '@appId'}
    }
  });
});

loMod.factory('LoStorageList', function($resource) {
  return $resource('/admin/applications/:appId/resources?expand=members', {
    appId : '@appId'
  }, {
    get : {
      method : 'GET'
    }
  });
});

loMod.factory('LoApp', function($resource) {
  return $resource('/admin/applications/:appId', {
    appId : '@appId'
  }, {
    get : {
      method : 'GET'
    }
  });
});

loMod.factory('LoAppList', function($resource) {
  return $resource('/admin/applications?expand=members');
});

loMod.factory('LoStorageLoader', function(Loader, LoStorage, $route) {
  return Loader.get(LoStorage, function() {
    return {
      appId : $route.current.params.appId,
      storageId: $route.current.params.storageId
    };
  });
});

loMod.factory('LoStorageListLoader', function(Loader, LoStorageList, $route) {
  return Loader.get(LoStorageList, function() {
    return {
      appId : $route.current.params.appId
    };
  });
});

loMod.factory('LoAppLoader', function(Loader, LoApp, $route) {
  return Loader.get(LoApp, function() {
    return {
      appId : $route.current.params.appId
    };
  });
});

loMod.factory('LoAppListLoader', function(Loader, LoAppList) {
  return Loader.get(LoAppList);
});
