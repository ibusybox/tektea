var app = angular.module('mainApp', ['ngSanitize']);

app.factory('signinService', ['$http', function(http){
    var funs = {};
    funs.processSignin = function(){
        var user_signin = false;

        http({
            url: '/user/current',
            method: 'GET',
            headers: {'Content-Type': 'application/x-www-form-encoded;charset=UTF-8'}
        }).success(function(data, status){
            funs.user_name = data.user_name;
            alert(funs.user_name);
            user_signin = true;
            var html = '<li><a href="/user?name=' + funs.user_name + '">' + funs.user_name + '</a></li>';
            angular.element('div .class ul').append(html);

        }).error(function(err, data){

        });
    };

    return funs;
}]);