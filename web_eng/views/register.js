$(function () {
  $('#registerForm').on('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    if ($('#password').val() !== $('#passwordRepeat').val()) {
     alert("Passwords don't match")

    }

    const username = $('#username').val();
    const password = $('#password').val();
    const passwordRepeat = $('#passwordRepeat').val();

    const registerData = {
      username: username,
      password: password,
      passwordRepeat: passwordRepeat
    };

    $.ajax({
      url: '/register',
      type: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(registerData), // Use data instead of body
      success: function (response) {
        console.log('Registration successful:', response);
      }
    });
  });
}); // Closing parenthesis moved to the end of the script block
