$(document).ready(function() {
  $('#registerForm').submit(function(event) {
    event.preventDefault();

    var username = $('#username').val();
    var password = $('#password').val();
    var passwordRepeat = $('#passwordRepeat').val();

    if (password !== passwordRepeat) {
      alert("Passwörter stimmen nicht überein.");
      return;
    }

    $.ajax({
      url: '/register',
      method: 'POST',
      data: {
        username: username,
        password: password
      },
      success: function(response) {
        if (response.success) {
          alert("Registrierung erfolgreich!");
          localStorage.setItem("token", response.accessToken);
          var token = localStorage.getItem("token");
          console.log(token);
          // Redirect to the desired page with the token
          window.location.href = '/content?token=' + token;
        } else {
          alert(response.message);
        }
      },
      error: function(xhr, status, error) {
        alert("Fehler bei der Registrierung: " + error);
      }
    });
  });
});
