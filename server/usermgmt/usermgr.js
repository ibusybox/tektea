var fs = require('fs');

var USER_FILE_PATH = process.cwd() + "/server/data/auth_data/users.json";

/**
* @method find user object by user name
* @param string, the user name
**/
function findUserByName(name, callback){
    fs.readFile(USER_FILE_PATH, "utf8", function (err, data){
        if ( err ){
            callback(err, null);
        }else{
            var found = false;
            //file is empty
            if ( data == null || '' == data ){
                //do nothing
            }else{
                var users = JSON.parse(data);
                for ( var i = 0; i < users.length; i++ ){
                    if ( users[i].name == name ){
                        callback(null, users[i]);
                        found = true;
                        break;
                    }
                }
            }
            if ( ! found ){
                callback( "user for name[" + name + "] could not be found.", null );
            }
        }
    });

} 

/**
* @method update the user to the user file, if user exist then update else save to a new one
* @param object user object
**/
function updateUser(user, callback){
    fs.readFile(USER_FILE_PATH, "utf8", function(err, data){
        if ( err ){
            callback(err, null);
        }else{
            var users = [];
            var exist = -1;

            if ( data != null && data != '' ){
                users = JSON.parse(data);
                //try to find exist user
                for ( var i = 0; i < users.length; i++ ){
                    if (users[i].name == user.name){
                        exist = i;
                        break;
                    }
                }                   
            }

            //if use exist then update, else add a new one
            if ( exist != -1 ){
                users[exist] = user;
            }else{
                users.push(user);
            }

            //save to file
            fs.writeFile(USER_FILE_PATH, JSON.stringify(users), "utf8", function(err){
                if ( err ){
                    callback(err, null);
                }else{
                    callback(null, user);
                }
            });

        }
    });

}

/**
* Return the current sign in user name
* input: none
*
* output: {user_name: xxx}
*/
function getCurrentUser(request, response){
    console.log(typeof request.session.user_name);
    var isLogin = (typeof request.session != "undefined" ) && ( typeof request.session.user_name != 'undefined' );
    console.log('isLogin = ' + isLogin);
    if ( isLogin ){
        var result = {user_name: request.session.username};
        response.writeHead(200, {'Content-Type' : 'text/json'});
        response.write(JSON.stringify(result));
        response.end();
    }else{
        response.writeHead(404, {'Content-Type' : 'text/plain'});
        response.end();
    }
}

/**
* Get all user info for the writers page display.
* intput data: none
*
* output data:
* {users: [{user_name: xxx, desc: xxxx, isOwner: true/false}]}
*/
function getAllUser4Display(request, response){
    //if user already signin, then the current user is the owner
    var current_user = '';
    if ( request.session.user_name && request.session.user_name != 'undefined' && request.session.user_name != null ){
        current_user = request.session.user_name;
    }
    
    var result = {users: []};

    fs.readFile(USER_FILE_PATH, "utf8", function(err, data){
        if ( err ){
            console.log('unable to read ' + USER_FILE_PATH);
            response.writeHead(500, {'Content-Type' : 'text/plain'});
            response.end();
        }else{
            var users = JSON.parse(data);
            var user;
            for( var i = 0 ; i < users.length; i++ ){
                user = {user_name: users[i].name, desc: users[i].desc, isOwner: current_user == users[i].name};
                result.users.push(user);
            }
            response.writeHead(200, {'Content-Type' : 'text/json'});
            response.write(JSON.stringify(result));
            response.end();
        }
    });
}

exports.updateUser = updateUser;
exports.findUserByName = findUserByName;
exports.getAllUser4Display = getAllUser4Display;
