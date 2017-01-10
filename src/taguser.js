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
    multiple: { //Whether multiple users may be selected for the given input
      enabled: false,
      element: ''
    },
    position_offset: { //Float user-selector position offset
      unit: 'px', //I.e. %, em, rem etc.
      value: 15 //Actual value to use, so by default 15px
    }
  };

  //Variable to store our users in
  var users = {};

  $.fn.tagUser = function(user_options){
    TagUser = $(this);
    setOptions(user_options);
    loadUsers(user_options);

    if(!isEmpty(users)){
      initiate();
    }
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
            case 'multiple':
              if(!isEmpty(user_options[key].enabled)){
                user_options[key].enabled = getBoolean(user_options[key].enabled);
                valid = true;
              }
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
  }

  //Initialises the element
  function initiate(){
    TagUser.keyup(function(e){
      //Don't fire on Shift, Ctrl, Alt
      if(e.keyCode != 16 && e.keyCode != 17 && e.keyCode != 18){
        if(!options.multiple && TagUser.siblings('.TagUser-output').length > 0){
          return false;
        }
        search(e.keyCode);
      }
    })
  }

  //Searches every time the user keyup's
  var current_search_index = -1; //Denotes the index within the input element where the @ was first used, -1 if no search currently
  function search(keyCode){
    $('.TagUser-float').remove(); //Remove any pre-existing floats

    var search_query = TagUser.val().toLowerCase();

    if(!isEmpty(search_query)){
      if(search_query.charAt(search_query.length - 1) == '@' || current_search_index > -1){ //TagUser-active on the element indicates a search has begun using @
        //If new user search, set the search index to this position
        if(search_query.charAt(search_query.length - 1) == '@'){
          current_search_index = search_query.length - 1;
        }

        //If user pressed backsapce or del, check if they've deleted the initial @ Search request
        if(keyCode == 8 || keyCode == 46){
          if(isEmpty(search_query.charAt(current_search_index))){ //User deleted the original @
            current_search_index = -1;
            return false;
          }
        }

        var top = Math.round(TagUser.position().top),
            height = Math.round(TagUser.height()),
            total = top + height + options.position_offset.value,
            output = '<div class="TagUser-float" style="top:' + total + options.position_offset.unit + '"><div class="TagUser-loader"></div></div>';
        TagUser.after(output);

        //Now get an array of user keys which match
        var matches = new Array();
        search_query = search_query.substring(current_search_index+1, search_query.length); //Cut down to just the data after the @
        console.log(search_query)

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
          output += '<div class="TagUser-float-user" data-TagUser-id="' + user_key + '">';

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

          output += '<div class="TagUser-float-user-name">';

          if(!isEmpty(users[user_key].name)){
            output += '<div>' + users[user_key].name + '</div>';
          }
          if(!isEmpty(users[user_key].username)){
            output +='<div>@' + users[user_key].username + '</div>';
          }
          output += '</div></div>';
        })

        //If no matches found and the last character input was a space, reset the search index
        if(isEmpty(output) && search_query.charAt(search_query.length - 1) == ' '){
          current_search_index = -1;
        }

        $('.TagUser-float').append(output).find('.TagUser-loader').remove();

        //Bind user click
        $('.TagUser-float-user').click(function(){
          selectUser($(this).attr('data-taguser-id'));
        })
      }
    }
  }

  //On user select, user_id is the given key for the selected user stored in data-taguser-id
  function selectUser(user_id){
    //Select name prefix for inputs
    if(!isEmpty(TagUser.attr('id'))){
      var name = 'TagUser-' + TagUser.attr('id');
    }else{
      var name = 'TagUser';
    }

    //If user can select multiple users
    if(options.multiple){

    }else{
      //Remove existing elements
      TagUser.siblings('.TagUser-output').remove();
      if(TagUser.is('input[type=text]')){ //Text input and only one selection, we append a single input[type=hidden]
        TagUser.val('').hide();
        TagUser.after('<div class="TagUser-selected-label" data-TagUser-id="' + user_id + '"><div><div>' + users[user_id].name + '</div><div><svg class="TagUser-X" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg></div></div>')
        TagUser.after('<input type="hidden" class="TagUser-output" name="' + name + '" value="' + user_id + '">');
        $('.TagUser-float').remove();
      }
    }

    //Bind any newly added labels to delete label and input
    $('.TagUser-selected-label svg').click(function(){
      var parent = $(this).closest('.TagUser-selected-label');
      var id = parent.attr('data-TagUser-id');

      parent.remove();

      //Remove the appropriateinput[type=hidden] element
      TagUser.siblings('.TagUser-output').each(function(){
        if($(this).val() == id){
          $(this).remove();
          return false;
        }
      })

      if(TagUser.is('input[type=text]')){

      }

      TagUser.show();
    })
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
