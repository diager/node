$(function () {

  
  $('#loginForm').on('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the username and password from the input fields
    const username = $('#username').val();
    const password = $('#password').val();

    // Create an object with the login credentials
    const loginData = {
      username: username,
      password: password
    };

    // Send the login request using jQuery AJAX
    $.ajax({
      type: 'POST',
      url: '/login',
      data: loginData,
      success: function (response) {
        // Handle successful login
        console.log('Login successful:', response);
        localStorage.setItem('token', response.token);
        const token = response.token;
        console.log('token: ', token)

        fetch('/content', {
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'X-Secret-Key': 'your_secret_key'
          }
        })
          .then(response => {
            if (response.ok) {
              window.location.href = '/content';
              return response.text();
            } else {
              throw new Error('Request failed');
            }
          })
          .then(data => {

            //console.log(data); // Display the protected content

          })
          .catch(error => {
            console.log('An error occurred:', error);
          });




        // Save the token in local storage
        //localStorage.setItem('token', data.token);
        // Redirect to protected content
        //window.location.href = '/content';



        // Store the token securely (e.g., in local storage or a cookie)
        // localStorage.setItem('jwtToken', token);

        // Include the token in subsequent requests by setting the Authorization header
        /*         const headers = {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                };
                localStorage.setItem('headers', headers); */
        //console.log("Headers: ", headers)



        //window.location.href = '/content';


        // Redirect to a new page or perform any desired actions
      },
      error: function (xhr, status, error) {


        const response = xhr.responseJSON;
        console.log("Response: ", response.error);
        if (response.error === 'Invalid username or password') {
          // Display the error message in the error box
          const error = "Invalid username or password"

          if (error) {
            const errorBox = document.getElementById('errorbox');
            errorBox.textContent = error;
            errorBox.style.display = 'block';
          }
        } else {
          // Handle other errors
          console.error('Login failed:', error);
          // Display a generic error message
          $('#errorbox').text('An error occurred during login');
        }
        // Handle login error
        console.error('Login failed:', error);
        // Display an error message to the user
      }
    });
  });
});
