$(document).ready(function() {
  $('#loginForm').submit(function(event) {
      event.preventDefault();

      var username = $('#username').val();
      var password = $('#password').val();

      $.ajax({
          url: '/login',
          method: 'POST',
          data: {
              username: username,
              password: password
          },
          success: function(response) {
              if (response.success) {
                  alert("Login erfolgreich!");
                  localStorage.setItem("token", response.accessToken);
                  var token = localStorage.getItem("token");
                  console.log(token);
                  //window.location.href = '/posts?token=' + token;
                  window.location.href = '/content?token=' + token;

                  form.append(authorizationHeader);
                  $("body").append(form);
                  form.submit();
              } else {
                  $('#errorbox').text(response.message).show();
              }
          }
      });
  });
});
