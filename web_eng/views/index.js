
$(document).ready(function () {

    let page_url = window.location.href
    let page_idIndex = page_url.lastIndexOf("#")
    let page_id = page_url.substring(page_idIndex + 1)
    console.log("page id: " + page_id)
    if (page_id == "section5") {
        $("html, body").animate({
            scrollTop: $("#scroll-" + page_id).offset().top -20
        }, 1000)
    }

})