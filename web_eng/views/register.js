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
                  //window.location.href = '/posts?token=' + token;
                  window.location.href = '/content?token=' + token;

                  form.append(authorizationHeader);
                  $("body").append(form);
                  form.submit();
              } else {
                  alert(response.message);
              }
          }
      });
  });
});


