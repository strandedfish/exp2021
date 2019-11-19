var start_time = 0;

var table_name = "default";
var user = "default";
var time_stamp = 0;
var jsonString = "";
var s_answer = "";
var tab1_time = 0;
var tab2_time = 0;
var block_touch_num = [];
var block_hover_time = [];

var dataUpload_interval;
var showInfo_interval;


var now_drag_object;
var draggable_prop = {
    // ドラッグ開始時の処理
    containment: ".pad-editor",
/*    snap: ".droppable",　*/
    helper: 'clone',
    opacity: 0.3,
    revert: "invalid",
    revertDuration: 500,
    start: function(event, ui) {
        $(this).hide();
        now_drag_object = $(this);
        block_touch_num[$(now_drag_object).attr("id")]++;
        $("#pad-console-right").text(block_touch_num);
        allocateId();
    },
    // ドラッグ終了時の処理
    stop: function(event, ui) {
        $(this).show();
        now_drag_object = null;
    }
};
var droppable_prop = {
  classes: {
    "ui-droppable-hover": "placeholder"
  },
  greedy: true,
  hoverClass: "hilite",
  tolerance: "pointer",
  over: function(event, ui) {

  },
  drop: function(event, ui) {
    $("#" + event.target.id).append(now_drag_object);
    now_drag_object.css({
      'top': '0px',
      'left': '0px'
    });
    addTable(now_drag_object, ui);
  }
};
var sortable_prop = {

}

var id_num;
var right_id;
var bottom_id;
var now_dropped_object;

// ドロップした場所によって横と縦を伸ばす関数
function addTable(now_drag_object, ui) {
  id_num = $(now_drag_object).parent().attr("id");
  id_num = id_num.split("-");
  right_id = id_num[0] +'-'+ (+id_num[1]+1);
  bottom_id = (+id_num[0]+1) +'-'+ id_num[1];
  now_dropped_object = $(now_drag_object).parent();
  /* 横を伸ばす */
  createColumn();
  /* 縦を伸ばす */
  createRow();
  createBlank(ui);
  setTimeout(function(){
    allocateId();
  }, 5);
  setTimeout(function(){
    redrawLine();
  }, 10);
  setTimeout(function(){
    drawBranchline();
  }, 50);
  setTimeout(function(){
    getJsonString();
  }, 50)
}

// 一行追加
function createColumn() {
  if($("#" + right_id).length == 0 && $(now_dropped_object).closest("table").length > 0) {
    $(now_dropped_object).parent().append('<td id='+ right_id +' class="droppable ui-droppable"></td>')
    $("#" + right_id).droppable(droppable_prop);
  }
}

// 一列追加
function createRow() {
  if($(now_dropped_object).closest("table").length > 0) {
    if($("#" + (+id_num[0]+1) +'-'+ 0).length == 0) {
      $(now_dropped_object).parent().parent().append('<tr></tr>');
    }
    for(var i=0; i<=(+id_num[1]); i++){
      if($("#" + (+id_num[0]+1) +'-'+ i).length == 0) {
        $(now_dropped_object).closest("tr").next().append('<td id='+ ((+id_num[0]+1) +'-'+ i) +' class="droppable ui-droppable"></td>')
        $("#" + ((+id_num[0]+1) +'-'+ i)).droppable(droppable_prop);
      }
    }
  }
}

// ドロップ場所を確保するため空行を追加
function createBlank(ui) {
  $("tr").each(function(index, element){
    if($(element).children().children("li").length > 0 && $(element).next().children().children("li").length > 0) {
      id_num = $(now_drag_object).parent().attr("id");
      id_num = id_num.split("-");
      $('<tr class="temp_row"></tr>').insertAfter($(element));
      for(var i=0; i<=(+id_num[1]); i++){
        $(element).next().append('<td id='+ ('temp-' + (+id_num[0]+1) +'-'+ i) +' class="droppable ui-droppable"></td>')
        $("#" + ('temp-' + (+id_num[0]+1) +'-'+ i)).droppable(droppable_prop);
      }
    }
  });
}

// ドロッパブル位置を計算・余分なセルを削除・番号振り分け
function allocateId() {
  // ２列以上の空列は存在しないはず
  var row_size = $("tr").length;
  for(var i=row_size; i>0; i--){
    tr_element = $("tr")[i];
    if($(tr_element).children().children("li").length == 0 && $(tr_element).next().children().children("li").length == 0) {
      $(tr_element).next().detach();
    }
  }
  // 一列目は空列
  if($("tr:first").find("li").length > 0){
    $("tr:first").before("<tr></tr>");
    $("tr:first").append('<td id=0-0 class="droppable ui-droppable"></td>');
  }
  // 番号振り分け
  $("tr").each(function(row, tr_element){
    $(tr_element).children("td").each(function(column, td_element){
      $(td_element).attr({
        'id': row +"-"+ column,
      })
      $('#'+row+'-'+column).droppable(droppable_prop);
    });
  });
  // 常に下側にdroppable領域があるように
  $("td").each(function(index, element) {
    if($(element).children("li").length > 0){
      id_num = $(element).attr("id");
      id_num = id_num.split("-");
      if($("#" + (+id_num[0]+1) +'-'+ id_num[1]).length == 0) {
        $(element).closest("tr").next().append('<td id='+ ((+id_num[0]+1) +'-'+ id_num[1]) +' class="droppable ui-droppable"></td>')
        $("#" + ((+id_num[0]+1) +'-'+ id_num[1])).droppable(droppable_prop);
      }
    }
  });
  // 空列の高さは狭く
  $("tr").each(function(index, element){
    if($(element).find("li").length == 0) {
      $(element).attr("class", "empty");
      $(element).children().height(40);
    } else {
      $(element).removeAttr("class");
    }
  });
  // 置けうる場所にのみdroppable
  $("td").droppable({disabled: true});
  $("td").css({"background-color": "rgba(25, 24, 23, 0.1)"});
  $("tr:first").children("td").droppable({disabled: false}); // 最初は絶対droppable
  $("tr:first").children("td").css({"background-color": "rgba(135, 206, 250, 0.2)"});
  $("td").each(function(index, element){
    if($(element).find("li").length > 0) {
      id_num = $(element).attr("id");
      id_num = id_num.split("-");
      if( $("#" + (id_num[0]) +'-'+ id_num[1]).find("li").children("div").hasClass("block-module") != 1 ) {
        $("#" + (+id_num[0]+0) +'-'+ (+id_num[1]+1)).droppable({disabled: false});  // 右は、ブロックでなければdroppable
        $("#" + (+id_num[0]+0) +'-'+ (+id_num[1]+1)).css({"background-color": "rgba(135, 206, 250, 0.2)"});
      }
      if($("#" + (+id_num[0]+0) +'-'+ (+id_num[1]+1)).find("li").length == 0) {
        $("#" + (+id_num[0]+1) +'-'+ (+id_num[1]+0)).droppable({disabled: false}); // 下は、右側に要素がなければdroppable;
        $("#" + (+id_num[0]+1) +'-'+ (+id_num[1]+0)).css({"background-color": "rgba(135, 206, 250, 0.2)"});
      } else {
        // 下は、一つ下から左下方向に走査し、要素があれば、その要素のひとつ上の列がdroppable
        $("td").each(function(index, element) {
          if($(element).find("li").length > 0) {
            id_num1 = $(element).attr("id");
            id_num1 = id_num1.split("-");
            for(var i=1; i<$("tr").length-id_num1[0] ;i++) {
              for(var j=0; j<id_num1[1]+1 ;j++) {
                if( $("#" + (+id_num1[0]+i) +'-'+ (+id_num1[1]-j)).find("li").length > 0 ) {
                  $("#" + (+id_num1[0]+i-1) +'-'+ (+id_num1[1])).droppable({disabled: false});
                  $("#" + (+id_num1[0]+i-1) +'-'+ (+id_num1[1])).css({"background-color": "rgba(135, 206, 250, 0.2)"});
                }

              }
            }
          }
        });
        $("tr:last").children("td").each(function(index, element) {
          $(element).droppable({disabled: false}); //　ただし一番したは常にdroppable
          $(element).css({"background-color": "rgba(135, 206, 250, 0.2)"});
        });
      }
      $(element).droppable({disabled: true}); //　ただしブロックは重ならないように
      $(element).css({"background-color": "rgba(25, 24, 23, 0.1)"});
    }
  });
  // 列の一番後ろだけが空白になるように
  $('tr').each(function(index, element){
    if($(element).find("li").length > 0) {
      while(true){
        if($(element).children().length < 1){
          break;
        } else if($(element).children().last().children("li").length == 0 && $(element).children().last().prev().children("li").length == 0){
          $(element).children().last().detach();
        } else {
          break;
        }
      }
    }
  });
}

var lineflag = 0;
var line_array = [];
function redrawLine() {
  if(lineflag == 1) {
    $.each(line_array, function(index, element){
      element.remove();
      line_array = [];
    });
  }
  line_array.push(new LeaderLine(
    document.getElementById( "start-block" ),
    document.getElementById( "end-block" ),
    {
      color: 'rgba(12, 10, 9, 1.0)',
      size: 2,
      startSocket: 'left',
      endSocket: 'left',
      startPlug: 'behind',
      endPlug: 'behind',
      path: 'straight'
    }
  ));
  lineflag = 1;

  $("td").each(function(index, element){
    // 横につながっていたら線を引く ただしブランチなら別
    if( $(element).children("li").children("div").hasClass("block-branch") ){
      var followblock_distance = 0;
      // 走査
      var num_branch = $(element).attr("id");
      num_branch = num_branch.split("-");
      num1_branch = num_branch[0];
      num2_branch = num_branch[1];
      //console.log( getId(num1_branch, num2_branch) + "はブランチ" );
      if($(getId(num1_branch, +num2_branch+1)).find("li").length > 0){
        //console.log( getId(num1_branch, +num2_branch+1) + "は存在" );
        for(var i=0; i<$("tr").length - num1_branch -1; i++) {
          var flg = (isFollowing(+num1_branch+i, +num2_branch+1) == 1 || i==0);
          if(flg == 0) {
            break;
          }
          if($(getId(+num1_branch+i, +num2_branch+1)).find("li").length > 0 && flg){
            //console.log(getId(num1_branch, +num2_branch+1) +"の下に"+ getId(+num1_branch+i, +num2_branch+1) + "を発見");
            line_array.push(new LeaderLine(
              document.getElementById( $(element).children("li").children("div").attr("id") ),
              document.getElementById( $(getId(+num1_branch+i, +num2_branch+1)).find("li").children("div").attr("id") ),
              {
                color: 'rgba(12, 10, 9, 1.0)',
                size: 1,
                startSocket: 'right',
                endSocket: 'left',
                startPlug: 'behind',
                endPlug: 'behind',
                path: 'straight'
              }
            ));
          }
        }
      }
    // ブランチじゃないなら普通に横に線を引く
    } else if( $(element).children("li").length > 0 && $(element).next().children("li").length > 0 ){
      line_array.push(new LeaderLine(
        document.getElementById( $(element).children("li").children("div").attr("id") ),
        document.getElementById( $(element).next().children("li").children("div").attr("id") ),
        {
          color: 'rgba(12, 10, 9, 1.0)',
          size: 2,
          startPlug: 'behind',
          endPlug: 'behind',
          path: 'straight'
        }
      ));
    }
    // 下の要素が、左側になにもないブロックであれば線を引く
    var id_num_forline = $(element).attr("id");
    id_num_forline = id_num_forline.split("-");
    var followblock_distance = -1;
    var isFollowing_flag = 1;
    // 左か左上の要素が、ブランチなら先はひかない
    for(var i=0; i<id_num_forline[0]; i++){
      if($(getId(id_num_forline[0]-i, id_num_forline[1]-1)).find("li").children("div").hasClass("block-branch") ){
        return;
      } else if($(getId(id_num_forline[0]-i, id_num_forline[1]-1)).find("li").length > 0) {
        break;
      }
    }
    // 下のブロックがなんブロック離れているか取得
    if($("#" + (+id_num_forline[0]) +'-'+ (+id_num_forline[1]+0)).find("li").length > 0){
      for(var i=1; i<$("tr").length - id_num_forline[0]; i++) {
        if($("#" + (+id_num_forline[0]+i) +'-'+ (+id_num_forline[1]+0)).find("li").length > 0) {
          followblock_distance = i;
          break;
        }
      }
    }
    // 下にブロックがあれば,下の要素が左側になにもないブロックであれば線を引く
    if(followblock_distance > 0 && $("#" + (+id_num_forline[0]+0) +'-'+ (+id_num_forline[1]+0)).find("li").length > 0 && $("#" + (+id_num_forline[0]+followblock_distance) +'-'+ (+id_num_forline[1]+0)).find("li").length > 0) {
      for(var i=1; i<=id_num_forline[1]; i++){
        if($('#' + (+id_num_forline[0]+followblock_distance) +'-'+ (+id_num_forline[1]-i) ).find("li").length > 0) {
          isFollowing_flag = 0;
        }
      }
      if(isFollowing_flag == 1) {
        line_array.push(new LeaderLine(
          document.getElementById($('#' + (+id_num_forline[0]) +'-'+ (+id_num_forline[1]) ).find("li").children("div").attr("id") ),
          document.getElementById($('#' + (+id_num_forline[0]+followblock_distance) +'-'+ (+id_num_forline[1]) ).find("li").children("div").attr("id") ),
          {
            color: 'rgba(12, 10, 9, 1.0)',
            size: 2,
            startSocket: 'left',
            endSocket: 'left',
            startPlug: 'behind',
            endPlug: 'behind',
            path: 'straight'
          }
        ));
      }
    }
  });

}
function myDraggable() {
  $('.draggable').draggable(draggable_prop);
  $('.droppable').droppable(droppable_prop);
  $('#draggable1').droppable(droppable_prop);
};
function mySortable() {

}
// タッチ回数ホバー回数保存用のArrayを定義
function createArray() {
  $(".block").each(function(index, element){
    block_touch_num.push(0);
    block_hover_time.push(0);
    $(element).parent().attr({
      'id': index
    });
  });
}
// ajax_test_createTable
function createTable() {
  var now = new Date();
  table_name = (now.getMonth()+1) +"月"+ now.getDate() +"日"+ now.getHours() +"時"+ now.getMinutes() +"分"+ user;
  table_name.toString();
  time_stamp = $.now();
  $.ajax({
    type: "POST",
    url: "ajax_test_createTable.php",
    datatype: "json",
    data: {
      'user': user,
      'time_stamp': time_stamp,
      'tab1_time': tab1_time,
      'tab2_time': tab2_time,
      'block_touch_num': block_touch_num,
      'block_hover_time': block_hover_time,
      'table_name': table_name,
      'json': jsonString
    },
    //通信が成功した時
    success: function(data) {
      $('#pad-console').append("通信せいこーっ☆☆☆");
      //console.log(data);
      $('.pad-editor').before('<div class="tuushin"></div>');
    },
    error: function(data) {
      $('#pad-console').append("通信しっぱい…(´・ω・｀)");
      //console.log(data);
    }
  });
};
let tuushin_count=0;
function dataUpload() {
  time_stamp = $.now();
  $.ajax({
    type: "POST",
    url: "ajax_test_add.php",
    datatype: "json",
    data: {
      'user': user,
      'time_stamp': time_stamp,
      'tab1_time': tab1_time,
      'tab2_time': tab2_time,
      'block_touch_num': block_touch_num,
      'block_hover_time': block_hover_time,
      'table_name': table_name,
      'json': jsonString
    },
    //通信が成功した時
    success: function(data) {
      $('#pad-console').append("通信せいこーっ♪");

      $('.tuushin').empty();

      $('.tuushin').append(tuushin_count+1 +"回目" + ($.now() - start_time)/1000 + "秒経過　◇　通信中");
      for(var i=0; i<tuushin_count%4; i++) {
        $('.tuushin').append("...");
      }
      tuushin_count += 1;
      
      console.log(data);
    },
    error: function(data) {
      $('#pad-console').append("通信しっぱい…");
      alert(($.now() - start_time)/1000 + "秒目◇通信失敗しました！！！");
      $('.pad-editor').css({
        "background-color": "red"
      })
      console.log(data);
    }
  });
};
// .questionファイルから問題データを読み込み
function loadKadai() {
  // ページ名と同じ名前の.questionファイルを読み込む
  var str = window.location.href.split('/').pop();
  str = str.replace('.html', '.question');
  $.get(str, function(text){
    // 正答読み込み
    var s_start = text.indexOf("<answer>")+8;
    var s_end = text.indexOf("</answer>");
    s_answer = text.slice(s_start, s_end);
    // 問題文
    var s_start = text.indexOf("<question>")+10;
    var s_end = text.indexOf("</question>");
    var s_question = text.slice(s_start, s_end);
    $(".pad-question").html(s_question);
    // ブロック読み込み
    text = text.replace(/\r?\n/g, '');
    s_start = text.indexOf("<block>")+7;
    s_end = text.indexOf("</block>");
    var block_part = (text.slice(s_start, s_end));
    var s_blocks = block_part.split("!!");
    var s_block;
    var block_html;
    for(var i=0; i<s_blocks.length-1; i++) {
      s_block = s_blocks[i].split("$");
      //console.log(s_block[0] + ", " + s_block[1] + ", " + s_block[2] + ";");
      switch(s_block[0]) {
        case 'block':
          block_html = "<li class='draggable' id="+i+"><div id='block-"+i+"' class='block-module block'><p class='module-name'>"+s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">');+"</p></div></li>";
          break;
        case 'submodule':
          block_html = "<li class='draggable' id="+i+"><div id='block-"+i+"' class='block-submodule block'><p class='module-name'>"+s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">');+"</p></div></li>";
          break;
        case 'loop':
          block_html = "<li class='draggable' id="+i+"><div id='block-"+i+"' class='block-loop block'><p class='module-name'>"+s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">');+"</p></div></li>";
          break;
        case 'branch':
          block_html = "<li class='draggable' id="+i+"><div id='block-"+i+"' class='block-branch block'><p class='module-name'>"+s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">');+"</p><canvas id='canvas' width='30' height='30'></canvas></div></li>";
          break;
      }
      // テキストが更新されたら取得
      $(document).on({
        'change': function(){
          getJsonString();
        }
      }, ".input-text");
      $(".pad-blockzone-in").children(".sortable").append(block_html);
/*      $("#block-"+i).balloon({
            contents: s_block[2]
      });
*/
      // 既存のブロックにポップアップを設定
      $("#block-"+i).balloon({
        position: "right",
        minLifetime: 0,
        delay: 1000,
        css: {
          'max-width': '300px',
          'font-size': '80%',
        },
        contents: s_block[2],
        html: true
      });

    }
  });
}
// canvasの大きさを動的に変更
function drawBranchline() {
  $('canvas').each(function(index, element){
    var w = $(element).parent().outerWidth(true);
    var h = $(element).parent().outerHeight(true);
    $(element).attr('width', w);
    $(element).attr('height', h);

    $.jCanvas.defaults.fromCenter = false;
    $(element).clearCanvas();
    $(element).drawLine({
      strokeStyle: "black",
      strokeWidth: "1",
      x1: $(element).closest('.block-branch').width(),
      y1: 0,
      x2: $(element).closest('.block-branch').width()-20,
      y2: $(element).closest('.block-branch').height()/2
    });
    $(element).drawLine({
      strokeStyle: "black",
      strokeWidth: "1",
      x1: $(element).closest('.block-branch').width()-20,
      y1: $(element).closest('.block-branch').height()/2,
      x2: $(element).closest('.block-branch').width(),
      y2: $(element).closest('.block-branch').height()
    });
  });
};
function showInfo() {
  $("#stage-info").html("<h2>"+user+"さん</h2>");
  $("#stage-info").append("<p>経過時間：" + ($.now() - start_time)/1000 + "秒</p>");
  $("#stage-info").append("<p>問題文：" + tab1_time/100 + "秒<br>PAD：" + tab2_time/100 + "秒<p>");
}
var passageTab1;
var passageTab2;
function tab1_countStart(){
  passageTab1 = setInterval(function(){
    tab1_time += 1;
  }, 10);
}
function tab2_conutStart(){
  passageTab2 = setInterval(function(){
    tab2_time += 1;
  }, 10);
}
function tab1_countStop(){
  clearInterval( passageTab1 );
}
function tab2_countStop(){
  clearInterval( passageTab2 );
}

function getJsonString() {
  temp_jsonString = "{\n"; //最上層
  temp_jsonString_innerText = "{\n"

  var tab_count = 0;
  searchFollowing(1, 0, tab_count);

  temp_jsonString = temp_jsonString + "}\n"; //最上層
  temp_jsonString_innerText += "}\n"

// 採点機能追加のため廃止
  jsonString = temp_jsonString_innerText;

  // 10/30シングルクオーテーションをエスケープするように
  
  jsonString = jsonString.replace(/'/g, "''");

  $("#serialize_output").val(jsonString);

}

// 階層を走査してtime_jsonStringに書き込み
function searchFollowing(num1, num2, tab_count) {
  var followblock_distance = 0;
  // 走査
  if($(getId(num1, num2)).find("li").length > 0){
    outer_loop:
    for(var i=0; i<$("tr").length - num1 -1; i++) {
      var flg = (isFollowing(+num1+i, num2) == 1 || i==0);
      if(flg == 0) {
        break;
      }
      if($(getId(+num1+i, num2)).find("li").length > 0 && flg) {
        //console.log(getId(num1, num2) +"の下に"+ getId(+num1+i, num2) + "を発見");
        for(var j=0; j<tab_count; j++){
          temp_jsonString = temp_jsonString + '____';
          temp_jsonString_innerText = temp_jsonString_innerText + '____';
        }
        var innerContent = $(getId(+num1+i, num2)).find("p").html();
        // inputを文字列に置き換える 一時的に！！
        $(getId(+num1+i, num2)).find("p").find("input").each(function(index, element){
          var s_start = innerContent.indexOf("<input");
          var s_end = innerContent.indexOf(">")+1;
          if(s_start !== -1 && s_end !== -1) {
            var s_input = innerContent.slice(s_start, s_end);
            innerContent = innerContent.replace(s_input, $(element).val());
          }
        });
        temp_jsonString_innerText = temp_jsonString_innerText + innerContent + "\n";
        temp_jsonString = temp_jsonString + $(getId(+num1+i, num2)).find("li").find("div").attr("id") + "\n";
        if($(getId(+num1+i, +num2+1)).find("li").length > 0){
          //console.log(getId(+num1+i, num2) +"の横に"+ getId(+num1+i, +num2+1) + "は存在");
          searchFollowing(+num1+i, +num2+1, tab_count+1);
        } else {

        }
        followblock_distance = i;
      }
    }
  }
}
function getId(num1, num2) {
  return '#' + num1 + '-' + num2;
}
function isFollowing(num1, num2) {
  var isFollowing_f = 1;
  for(var i=1; i<=num2; i++){
    if($(getId(num1, +num2-i)).find("li").length > 0) {
      isFollowing_f = 0;
    }
  }
  return isFollowing_f;
}

function hideLine(){
  $.each(line_array, function(index, element){
    element.hide("none");
  });
}
function showLine(){
  $.each(line_array, function(index, element){
    element.show("none");
  });
}

var num = 0;
$(function() {
  var hoverFlag=0;
  // 新たなブロックを追加（デバック用）
  $('#new-block-btn').on('click', function() {
    var module_style = $('input[name="module-style"]:checked').val();
    var balloon = $('#new-block-balloon').val();
    var name = $('#new-block-name').val();
    var dom = "<li><div id='id-"+num+"' class='"+ module_style +" block' alt='"+ balloon +"'><p>"+ name +"</p></div><ol></ol></li>";
    $('.pad-blockzone .sortable').append(dom);
    $('.block').draggable(draggable_prop);
    $('.block').balloon({
      position: "right",
      minLifetime: 0,
      css: {
        'max-width': '300px',
        'font-size': '80%',
      }
    });
    num=num+1;
  });
  // resizeされたら分岐の枠線を合わせて変形
  $(window).on('load resize', function(){
    console.log("ウィンドウサイズ変更");
    drawBranchline();
  });

  // タブボタンによる表示切り替えや時間計測の切り替え
  $(".tab_area label").on("click",function(){
    var $th = $(this).index();
    $(".tab_label").removeClass("active");
    $(".tab_panel").removeClass("active");
    $(this).addClass("active");
    $(".tab_panel").eq($th).addClass("active");
    if($(this).index() == 0) {
      tab2_countStop();
      tab1_countStart();
      hideLine();
    } else if($(this).index() == 1) {
      tab1_countStop();
      tab2_conutStart();
      showLine();
    }
  });

  // 提出ボタン
  $("#submit-btn").on("click", function() {
    clearInterval( showInfo_interval );
    clearInterval( dataUpload_interval );
    clearInterval( passageTab1 );
    clearInterval( passageTab2 );
  });
  $("#panel2").scroll(function() {
    $.each(line_array, function(index, element){
      element.position();
    });
  });
  // テキストアリアにフォーカスしているのか！？
  var inputAreaFocusing = 0
  $(".input-text")
  .focusin(function(element){
    $(this).css("color", "red")
    inputAreaFocusing = 1;
  })
  .focusout(function(element){
    setTimeout(function(){
      inputAreaFocusing = 0;
    }
    , 800)
  });
  // 要素にマウスオーバーしている時間を取得
  var hover_time;
  var now_dragging = 0;
  $(document).on({
    'mouseenter': function(){
      sethover = setTimeout(function(){
        hover_time = $.now();
        //$('#pad-console-left').append('<p>' + $.now() + $(this).find("p").text() + ': Mouse Entered</p>');
        //$('#pad-console-left').animate({scrollTop: $('#pad-console-left')[0].scrollHeight}, 0);
        hoverFlag = 1;
      }, 1000);
    },
    'mouseleave': function(){
      if(hoverFlag == 1){
        hover_time = $.now() - hover_time;
        //$('#pad-console-left').append('<p>' + $.now() + $(this).find("p").text() +  ': Mouse Left</p>');
        //$('#pad-console-left').animate({scrollTop: $('#pad-console-left')[0].scrollHeight}, 0);
        if ( hover_time >= 1000 && inputAreaFocusing == 0 ) {
          block_hover_time[$(this).closest("li").attr("id")] += hover_time;
          $('#pad-console-left').append('<p>' + $(this).find("p").text() + 'の説明を見た秒数' + block_hover_time[$(this).closest("li").attr("id")] + 'ms</p>');
          console.log(hover_time)
          $('#pad-console-left').animate({scrollTop: $('#pad-console-left')[0].scrollHeight}, 0);
        }
        hoverFlag=0;
        hover_time=0;
      }
      clearTimeout(sethover);
    }
  }, '.block',);
  // マウスダウンしたらバルーンは隠す
  $(document).on('mousedown', '.block', function() {
    $(this).hideBalloon();
    if(hoverFlag == 1){
      hover_time = $.now() - hover_time;
      $('#pad-console-left').append('<p>' + $(this).closest("li").attr("id") +  ': Mouse Hovered ' + hover_time + 'ms</p>');
      $('#pad-console-left').animate({scrollTop: $('#pad-console-left')[0].scrollHeight}, 0);
      hoverFlag=0;
      hover_time=0;
    }
  });
  // sortable専用メソッド♪
  var adjustment;
  var dragging;
  $(document).ready(function(){
    // ログインボタン（仮）による画面切り替えと時間計測開始
    $("#login-btn").on("click", function(){
      user = $("#name").val();
      if(user == ""){
          $(".login").children("h3").css({
            'color': 'red',
          });
      } else {
        start_time = $.now();
        $(".login-wrapper").css({
          'display': 'none',
        });
        $("#stage-info").css({
          'display': 'block',
          //'display': 'hidden'
        });
        $(".debug-console").css({
          'display': 'block'
//          'display': 'none'
        });
        // 問題文など各種読み込み
        loadKadai();
        setTimeout(function(){
          drawBranchline();
          tab1_countStart();
//          var data = group.sortable("serialize").get();
//          jsonString = JSON.stringify(data, null, ' ');
          createArray();
          createTable();
          myDraggable();
          mySortable();
        },500);
        // ☆5秒？？？？ごとにデータを収集☆
        dataUpload_interval = setInterval('dataUpload()', 5000);
        showInfo_interval = setInterval('showInfo()',10);
      }
    });
    // そーたぶる
    $(".tab_panel").eq(1).addClass("active");
    $(".tab_label").removeClass("active");
    $(".tab_panel").removeClass("active");
    $(".tab_label").eq(0).addClass("active");
    $(".tab_panel").eq(0).addClass("active");

  });

});
