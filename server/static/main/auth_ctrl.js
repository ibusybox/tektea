angular.module('authApp', ['ngCookies']);

function AuthCtrl($scope, $http, $cookies){

    $scope.registInfo = {user_name: '', password: '', repeat_password: ''};

    $scope.signinInfo = {user_name: '', password: ''};

    $scope.registerError = '';

    $scope.signinError = '';

    $scope.registAction = function(){
        $http({
            url: '/register/post',
            method: 'POST',
            data: $scope.registInfo,
            headers: {'Content-Type': 'application/json; charset=UTF-8'}
        }).success( function(data, status){
            if ( data.status === 0 ){
                window.location.href = '/user?name=' + $scope.registInfo.user_name;
            }else if (data.status == 1 ){
                $scope.registerError = '用户"' + $scope.registInfo.user_name + '"已经存在。';
            }else{
                $scope.registerError = '注册失败。';
            }
        } ).error( function(data, status){
            $scope.registerError = '注册失败，服务器内部错误。';
        });
    };

    $scope.autoSignin = function(){
        var sendData = {
            user_name: typeof $cookies.user_name === 'undefined' ? '' : Base64.decode($cookies.user_name), 
            token: typeof $cookies.token === 'undefined' ? '' : $cookies.token
        };
        $scope.signin(sendData, true);
    };


    $scope.signinAction = function(){
        var sendData = {
            user_name: $scope.signinInfo.user_name, 
            password: $scope.signinInfo.password
        };
        $scope.signin(sendData, false);
    };

    $scope.signin = function(sendData, auto){
        $http({
            url: '/signin/post', 
            data: sendData,
            method: 'POST',
            //Content-Type should be application/x-www-form-encoded
            //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            headers: {'Content-Type': 'application/json; charset=UTF-8'}
        }).
            success( function ( data, status ){
                console.log('sign status = ' + data.status);
                //data is an json object
                if ( data.status === 0 ){
                    window.location.href = '/';
                }else if ( data.status === 2 ){
                    //token expired, redirect to /signin
                    window.href.location = '/signin';
                }else {
                    //user name or password wrong
                    //auto sign in dont show the error message
                    if ( ! auto ){
                        $scope.signinError = "用户名或密码错误";
                    }
                    
                }
                
            } ).
            error( function ( data, status ){
                $scope.signinError = 'Sorry i was wrong bcoz of code: ' + status;
            } );
    }
}