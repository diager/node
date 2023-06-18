const createCardButton = document.getElementById("createNewButton");
const createCardBorder = document.getElementById("createCardBorder");

const abbrechenButton = document.getElementById("deleteWindowButton");
//const deleteWindowCardBorder = document.getElementById("deleteWindowCardBorder");
var deleteWindowCardBorder = document.getElementById('deleteWindowCardBorder');
var deleteButton = document.getElementById('deleteWindowCardButton');


const updateCardBorder = document.getElementById("updateCardBorder"); //when clicking on change element
const closeCardButton = document.getElementById("closeCard");
const cardKuerzel = document.getElementById("kuerzel");
const cardThema = document.getElementById("thema");
const cardText = document.getElementById("text");

const updateForm = document.getElementById("updateForm");
const closeUpdateCard = document.getElementById("closeUpdateCard");
const textarea = document.getElementById('kuerzel');
const errorMessage = document.getElementById('errorbox');

textarea.addEventListener('input', () => {
  if (textarea.value.length > 7) {
    errorMessage.style.display = 'block';
  } else {
    errorMessage.style.display = 'none';
  }
});


/* 
deleteButton.addEventListener("click", function () {
  deleteWindowCardBorder.style.display = "none";
}) */


// Get all the loeschen cells
var loeschenCells = document.querySelectorAll('#loeschen');
//get all ändern cells
const editCells = document.querySelectorAll("#aendern");



createCardButton.addEventListener("click", function () {
  createCardBorder.style.display = "block";
});

closeCardButton.addEventListener("click", function () {
  createCardBorder.style.display = "none";
  cardKuerzel.value = "";
  cardThema.value = "";
  cardText.value = "";
});

$('table tbody').on('click', 'tr', function () {
  var id = $(this).data('id');
  //console.log("ID: ", id)
  $.ajax({
    url: '/text?id=' + id,
    success: function (html) {

      $('#textbox').html(html.text);
    }
  });
});



editCells.forEach(cell => {
  cell.addEventListener('click', () => {
    updateCardBorder.style.display = "block";
    $('#closeUpdateCard').click(function() {
      $('#updateCardBorder').css('display', 'none');
    });

    let row = cell.parentNode;
    let id = row.getAttribute('data-id');
    console.log("this is the ändern id: " + id)
    
    closeUpdateCard.addEventListener("click", () => {
      updateCardBorder.style.display = "none";

    });

    $.ajax({
      url: "/getUpdateRow/" + id,
      type: "GET",
      success: function(response) {
        // Handle the successful response
        console.log(response);
        console.log(response.result.kuerzel);
        $('#kuerzelU').val(response.result.kuerzel);
        $('#themaU').val(response.result.thema);
        $('#textU').val(response.result.text);

        $('#updateForm').on('click', function() {
          
          
          $.ajax({
            url: '/updateRow/' + id,
            type: 'POST',
            data: {
              kuerzel: $('#kuerzelU').val(),
              thema: $('#themaU').val(),
              text: $('#textU').val(),
            },
            success: function(response) {
              //$('#updateCardBorder').css('display', 'none');
              // Handle the successful response
              console.log('POST request successful');
              // Perform any additional actions based on the response
            },
            error: function(xhr, status, error) {
              // Handle the error
              console.log('An error occurred: ' + error);
            }
          });
          $('#updateCardBorder').css('display', 'none');
        });
        

      },
      error: function(xhr, status, error) {
        // Handle the error
        console.log("An error occurred: " + error);
      }
    });


  })
})



// Add event listener to "loeschen" HTML element
loeschenCells.forEach(function (cell) {
  cell.addEventListener('click', function () {

    // Show delete confirmation window
    deleteWindowCardBorder.style.display = "block";

    abbrechenButton.addEventListener('click', function () {
      deleteWindowCardBorder.style.display = "none";
    })



    // Attach event listener to "delete" button in the confirmation window  
    deleteButton.addEventListener('click', function () {
      var row = cell.parentNode;
      var id = row.getAttribute('data-id');

      // Make an AJAX request to the server to delete the row from the database
      var xhr = new XMLHttpRequest();
      xhr.open('DELETE', '/contentTable/' + id, true);
      xhr.send();

      // Remove the row from the table
      row.parentNode.removeChild(row);
      deleteWindowCardBorder.style.display = "none";
      // Hide the delete confirmation window
    });

  });
});





