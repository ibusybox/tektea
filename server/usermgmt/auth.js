var queryString = require('querystring');
var utils = require('../utils');
var fs = require('fs');
var userMgr = require('./usermgr');

//token valid duration in million second, one month
var TOKEN_VALID_DURATION = 1000*3600*24*30;

function isSingin(request, callback){
    var isLogin = (typeof request.session != "undefined" ) && ( typeof request.session.username != 'undefined' );
    console.log('isLogin = ' + isLogin);

    if ( ! isLogin ){
        callback( null, false);
        return;
    }
    console.log('request.session.username = ' + request.session.username);

    var usernameEncrypted = request.session.username;
    isNameIncluded(usernameEncrypted, function( err, isIncluded){
        if ( err ){
            callback(err, false);
        }else{
            callback(null, isIncluded);
        }
    });
}


function checkSingin(request, response, afterSingin){
    isSingin(request, function( err, isSignin ){
        if ( err || ! isSignin ){
            response.writeHead(302, {'Location' : '/signin'});
            response.end();
        }else{
            afterSingin();
        }
    });

}

function isNameIncluded(name, callback){
    var isNameIncluded = false;
    fs.readFile(process.cwd() + '/server/data/names', 'utf8', function( err, data){
        if ( err ){
            callback(err, false);
        }else{
            isNameIncluded = (data.indexOf(name) != -1);
            callback(null, isNameIncluded);
        }
        
    } );
}

/**
* rsponse for '/register/post' post request.
* input json data:
* {user_name: '', password: '', repeat-password: ''}
* 
* output json data:
* {status: code}
*/
function register(request, response){
    request.setEncoding("utf8");

    var regist_info = request.body;

    var result = {status: 0};

    //check if user already exist then return 1
    userMgr.findUserByName(regist_info.user_name, function( err, user ){
        

        //not exist
        if ( err ){
            //check if 2 password is same else return 2
            if ( regist_info.password != regist_info.repeat_password ){
                result.status = 2;
                response.writeHead(200, {'Content-Type' : 'text/json'});
                response.wirte(JSON.stringify(result));
                response.end();
            }else{
                var cookieMaxAge = 1000*3600*24*365;
                var token = genTokenSync();
                var user = {name: '', password: '', token: '', tokenExpired: ''};
                response.cookie('token', utils.encryptAES( token ), {maxAge: cookieMaxAge});
                response.cookie('user_name', toBase64( regist_info.user_name ), {maxAge: cookieMaxAge});
                user.name = regist_info.user_name;
                user.password = regist_info.password;
                user.token = token;
                user.tokenExpired = Date.now() + TOKEN_VALID_DURATION;

                userMgr.updateUser( user, function(err, data){
                    if ( err ){
                        //save user failed
                        result.status = 3;
                    }else{
                        result.status = 0;
                    }
                    response.writeHead(200, {'Content-Type' : 'text/json'});
                    response.write(JSON.stringify(result));
                    response.end();
                } );
            }
        }else{
            //user already exist
            result.status = 1;
            response.writeHead(200, {'Content-Type' : 'text/json'});
            response.write(JSON.stringify(result));
            response.end();
        }
    });
}

function genTokenSync(){
    var random_str = utils.getRandomString();
    var timestamp = new Date().getTime();
    var token = random_str + '_' + timestamp;
    return token;
}

/**
* the user sign in request '/signin/post' .
* input json data:
* {user_name: '', token: ''} or {user_name: '', password: ''}
* if token exist then use the token, else use the user name and password.
*
* output json data:
* {status: code}
* code values:
* 1: user not exist
* 2: token expired
* 3: user name or password is wrong
**/
function signin(request, response){
    request.setEncoding("utf8");

    var client_data = request.body;
    console.log(client_data);

    var ret_data = {status: 0};

    response.writeHead(200, {'Content-Type' : 'text/json'});

    //if token exist
    var token_exist = typeof client_data.token != "undefined" ;
    if ( token_exist ){
        signinWithToken( client_data.user_name, client_data.token, function( result ){
            ret_data.status = result;
            response.write(JSON.stringify(ret_data));
            response.end();
        });
    }else{
        //sign in with user name and password, if succeed, renew the token
        signinWithUserNamePassword( client_data.user_name, client_data.password, function(result){
            ret_data.result = result;
            if ( result === 0 ){
                request.session.user_name = client_data.user_name;
                request.session.token = client_data.token;
            }
            response.write(JSON.stringify(ret_data));
            response.end();            
        } );
    }

}

function signinWithToken(user_name, token, callback){
    userMgr.findUserByName(user_name, function( err, user ){
        if ( err ){
            //user not exist
            callback(1);
        }else{
            //token expired
            if ( user.tokenExpired - Date.now() <= 0 ){
                callback(2);
            }else{
                callback(0);
            }
        }
    } );
}

function signinWithUserNamePassword(user_name, password, callback){
    userMgr.findUserByName(user_name, function( err, user ){
        if ( err ){
            //user note exist
            callback(1);
        }else{
            if ( user.password == password ){
                callback(0);
                //update the token
                user.tokenExpired = Date.now() + TOKEN_VALID_DURATION;
                userMgr.updateUser(user, function(err,data){
                    if ( err ){
                        console.log('update toke expired for user: ' + user_name + ' failed.');
                    }else{
                        console.log('update toke expired for user: ' + user_name + ' succeed.');
                    }
                });
            }else{
                callback(3);
            }
        }
    });
}


function toBase64(str){
    return new Buffer(str, 'utf8').toString('base64');
}

exports.signin = signin;
exports.isSingin = isSingin;
exports.checkSingin = checkSingin;
exports.register = register;
