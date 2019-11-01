function getUserByEmail(givenemail,users) {
  let arr = Object.values(users);
  let userObj = {};
  for (let i = 0; i < arr.length; i++) { 
    if(arr[i].email === givenemail){
      userObj["id"] = arr[i].id;
      userObj["email"] = arr[i].email;
      userObj["password"] = arr[i].password;
      return userObj;  
    } 
  }
  return userObj; 
}
module.exports = getUserByEmail;