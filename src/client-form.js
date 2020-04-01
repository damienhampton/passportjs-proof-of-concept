const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');

loginButton.addEventListener('click', (e) => {
  const username = usernameInput.value;
  const password = passwordInput.value;
  e.preventDefault();
  console.log(e, username, password);
  window.location = '/login?username='+username+'&password='+password;
})



