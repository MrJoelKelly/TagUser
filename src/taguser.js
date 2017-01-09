/*
  jQuery TagUser Plugin
  https://github.com/MrJoelKelly/TagUser
  Joel Kelly (Joel.Kelly@keltec.systems)
*/
(function($){
  var TagUser; //The element to listen for user tags

  var system_options = { //Checks that a given option is from a valid list
    search_type: {
      'local': null,
      'remote': null
    }
  };

  //Pre-determined options, will be updated based on user-set options
  var options = {
    search_type: 'local', //'local' or 'remote'
    remote_url: null,  //Only used if search_type is 'remote'
    photo: true,
    default_photo: { //"Photo" to use if one doesn't exist for a user.
      type: 'markup', //'markup' or 'img'
      src: '<svg class="TagUser-X" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg>' //If 'markup', then some HTML to display, if 'img', the path to the image
    },
    keys: { //Keys returned within the user object, value following denotes whether it is a searchable key
      'name': true,
      'username': true,
      'photo': false
    },
  };

  //Variable to store our users in
  var users = {};

  $.fn.tagUser = function(user_options){
    TagUser = $(this);
    setOptions(user_options);
    loadUsers(user_options);
  };

  //Takes user defined options and updates the default options where appropriate
  //Ignores any invalid options
  function setOptions(user_options){
    //Iterate through keys given in users options
    for(var key in user_options){
      //Check not empty value
      if(!isEmpty(user_options[key])){ //If value not empty
        //If exists in default_options, these are user-definable options
        if(key in options){
          //If the key exists in system_options, we need to check that the parameter passed is also valid
          if(key in system_options){
            //If a valid option from system_options
            if(!(user_options[key] in system_options[key])) continue //Skips rest of loop if the key doesn't have a valid value within system_options
          }

          //Validation tests
          valid = false; //Presume invalidity
          switch(key){
            case 'users':
              valid = false; //These will be loaded in after everything else
              break;
            default: //Any others that don't require validation, such as buttonText
              valid = true;
              break;
          };

          if(valid){
            options[key] = user_options[key]; //Update default_options values
          }
        }
      }
    }
  };

  //Loads the users/settings for getting users
  function loadUsers(user_options){
    if(options.search_type === 'local'){
      if(!isEmpty(user_options.data)){
        if(!Array.isArray(user_options.data) && typeof(user_options.data) === 'object'){ //If data passed is an object
          for(var key in user_options.data){
            //Verify the data format in options.keys matches the data we've been given
            var valid = false; //Checks that at least one given key is searchable
            for(var given_key in options.keys){
              if((given_key in user_options.data[key]) && (given_key in options.keys)){ //Data is added to database so long as at least one valid key is given
                if(isEmpty(users[key])){ //Initialise initial object
                  users[key] = {};
                }
                users[key][given_key] = user_options.data[key][given_key];
                if(options.keys[given_key]){
                  valid = true;
                }
              }
            }
            if(!valid){
              delete users[key];
            }
          }
        }
      }
    }else if(options.search_type === 'remote'){

    }

    //Data validated
    if(!isEmpty(users)){
      initiate();
    }
  }

  //Initialises the element
  function initiate(){
    TagUser.keyup(function(){ search(); })
  }

  //Searches every time the user keyup's
  function search(){
    $('.TagUser-float').remove(); //Remove any pre-existing floats

    var search_query = TagUser.val().toLowerCase();

    if(!isEmpty(search_query)){
      var top = Math.round(TagUser.position().top),
          height = Math.round(TagUser.height()),
          offset = 30,
          total = top + height + offset;
      var output = '<div class="TagUser-float" style="top:' + total + 'px"><div class="TagUser-loader"></div></div>';
      TagUser.after(output);

      //Now get an array of user keys which match
      var matches = new Array();

      //Search for matches
      users_search:
      for(var key in users){
        sub_search:
        for(var sub_key in users[key]){
          if(options.keys[sub_key]){ //Check this is a searchable key
            var test_string = users[key][sub_key].toLowerCase();
            if(test_string.search(search_query) > -1){
              matches.push(key);
              break sub_search;
            }
          }
        }
      }

      //Now draw matches
      output = '';
      $.each(matches, function(index, user_key){
        output += '<div class="TagUser-float-user">';
        if(options.photo){
          output += '<div class="TagUser-float-user-photo">';
          if(!isEmpty(users[user_key].photo)){
            output += '<img src="' + users[user_key].photo + '">';
          }else if(options.default_photo.type === 'img'){
            output += '<img src="' + options.default_photo.src + '">';
          }else if(options.default_photo.type === 'markup'){
            output += options.default_photo.src;
          }
          output += '</div>';
        }
        output += '<div class="TagUser-float-user-name"><div>' + users[user_key].name + '</div><div>@' + users[user_key].username + '</div></div></div>';
      })
      $('.TagUser-float').append(output).find('.TagUser-loader').remove();
    }
  }

  //Used to test if an object/val is empty.
  //Return true if empty, false if not
  function isEmpty(value){
    var test_string = value+'';
    if(!test_string || value == null){
      return true;
    }else{
      return false;
    }
  }

  //Checks if a value is boolean, converts from string, int etc. Returns true/false, also returns false if not boolean
  function getBoolean(value){
    var valid_values = [false,0,'false','0',true,1,'true','1'];
    var index = valid_values.indexOf(value);
    if(index > 3 && index < 8){
      return true;
    }

    return false;
  }

  //Throws an error on the object
  function throwError(code,timer){
    var error_codes = {
      0: 'Unknown error occurred',
      1: 'Error sending data to server',
      2: 'Invalid value entered',
      404: '404: Page (' + options.url + ') not found',
      500: '500: Internal Server Error'
    }

    if(isEmpty(code) || isEmpty(error_codes[code])){
      code = 0; //Unknown error
    }

    var text = error_codes[code];

    //Displays custom data-regex-comment if exists
    if(!isEmpty(values.regex.comment) && code == 2){
      text = values.regex.comment;
    }

    if(isEmpty(text)){ //Default error string
      text = 'An unknown error occurred';
    }

    var error_element = $('<div class="InlineEdit-error-float">' + text + '</div>');

    InlineEdit.addClass('InlineEdit-error').append(error_element);

    if(!isEmpty(timer) && !  isNaN(timer)){ //Setting timeout to hide certain errors after some time
      setTimeout(function(){
        error_element.fadeOut(function(){error_element.remove();});
      }, timer);
    }
  }
})(jQuery);
