function callBack(data){
    // console.log(data);
}

$(function(){
    str = window.location.href
    console.log(str)
    $.ajax({
        url: "saiyou_mondai",
        success: function(data) {
            console.log(data);
            $(data).find("a[href*='.question']").each(function() {
                console.log(this)
                var filename = this.pathname;
                filename = filename.replace("/", "").replace(".question", "").replace(" ", "");
                console.log(filename);
                $(".kadai_list").append('<li><a href="kadai.html?name='+filename+'">' + filename + '</a></li>')
            });
        },
        error: function(data) {
            console.log(data);
        }
    });
    // for(var i=1; i<20; i++){
    //     for(var j=1; j<10; j++){
    //         $.ajax({
    //             type: "GET",
    //             url: "kadai"+i+"-"+j+".question",
    //             async: false
    //         }).done(function(data){
    //             console.log("kadai"+i+"-"+j+".html is found.");
    //             var name = encodeURIComponent("kadai"+i+"-"+j)
    //             $(".kadai_list").append('<li><a href="kadai.html?name='+name+'">課題'+i+'-'+j+'</a></li>')
    //         }).fail(function(data){
    //             console.log("kadai"+i+"-"+j+".html is not found (this is not error).")
    //         })
    //     }
    // }
})