var myUsers = {
  0: {
    name: 'John Smith',
    username: 'JohnSmith'
  },
  1: {
    name: 'Jane Smith',
    username: 'JaneSmith'
  },
  2: {
    name: 'Bob Robson',
    photo: 'demo-photo.jpeg',
    nothing: 'bla'
  },
  3: {
    name: 'Jake Jameson',
    username: 'Jobber',
    fakeshit: 'bla'
  },
}

$(document).ready(function(){
  $('#singleInput').tagUser({data: myUsers});
  $('#multipleInput').tagUser({data: myUsers, multiple: true});
  $('#editableDiv').tagUser({data: myUsers, multiple: true});
})
