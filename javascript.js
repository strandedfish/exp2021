var start_time = 0;

var table_name = "default";
var user = "default";
var time_stamp = 0;
var jsonString = "";
var prev_jsonString = "";
var s_answer = "";
var tab1_time = 0;
var tab2_time = 0;
var tab3_time = 0;
var tab4_time = 0; // as ウィンドウ非アクティブ
var copy_num = 0;
var compile_num = 0;
var kadai = null;
var block_touch_num = [];
var block_hover_time = [];
var temp_jsonString = "";
var temp_jsonString_innerText = "";
var dataUpload_interval;
var showInfo_interval;
// var linePath = acgraph.path();
var stage = null;
var inactive_time = 0;


var now_drag_object;
var draggable_prop = {
    // ドラッグ開始時の処理
    containment: ".main-wrapper",
    /*    snap: ".droppable",　*/
    helper: "clone",
    // stack: ".main-wrapper .pad-line",
    zIndex: 1000,
    opacity: 0.3,
    revert: "invalid",
    revertDuration: 500,
    start: function (event, ui) {
        $(this).hide();
        now_drag_object = $(this);
        block_touch_num[$(now_drag_object).attr("isoid")]++;
        $("#pad-console-right").text(block_touch_num);
        allocateId();
    },
    // ドラッグ終了時の処理
    stop: function (event, ui) {
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
    over: function (event, ui) {

    },
    drop: function (event, ui) {
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

// ドロップした場所によって関数
function addTable(now_drag_object, ui) {
    id_num = $(now_drag_object).parent().attr("id");
    id_num = id_num.split("-");
    right_id = id_num[0] + '-' + (+id_num[1] + 1);
    bottom_id = (+id_num[0] + 1) + '-' + id_num[1];
    now_dropped_object = $(now_drag_object).parent();
    /* 横を伸ばす */
    createColumn();
    /* 縦を伸ばす */
    createRow();
    createBlank(ui);
    setTimeout(function () {
        allocateId();
    }, 5);
    setTimeout(function () {
        drawBranchline();
        redrawLine();
    }, 10);
    setTimeout(function () {
        getJsonString();
        // コピーボタンを開放
        document.getElementById("copy2clipboard").disabled = "";
    }, 50)
}

// 一行追加
function createColumn() {
    if ($("#" + right_id).length == 0 && $(now_dropped_object).closest("table").length > 0) {
        $(now_dropped_object).parent().append('<td id=' + right_id + ' class="droppable ui-droppable"></td>')
        $("#" + right_id).droppable(droppable_prop);
    }
}

// 一列追加
function createRow() {
    if ($(now_dropped_object).closest("table").length > 0) {
        if ($("#" + (+id_num[0] + 1) + '-' + 0).length == 0) {
            $(now_dropped_object).parent().parent().append('<tr></tr>');
        }
        for (var i = 0; i <= (+id_num[1]); i++) {
            if ($("#" + (+id_num[0] + 1) + '-' + i).length == 0) {
                $(now_dropped_object).closest("tr").next().append('<td id=' + ((+id_num[0] + 1) + '-' + i) + ' class="droppable ui-droppable"></td>')
                $("#" + ((+id_num[0] + 1) + '-' + i)).droppable(droppable_prop);
            }
        }
    }
}

// ドロップ場所を確保するため空行を追加
function createBlank(ui) {
    $("tr").each(function (index, element) {
        if ($(element).children().children("li").length > 0 && $(element).next().children().children("li").length > 0) {
            id_num = $(now_drag_object).parent().attr("id");
            id_num = id_num.split("-");
            $('<tr class="temp_row"></tr>').insertAfter($(element));
            for (var i = 0; i <= (+id_num[1]); i++) {
                $(element).next().append('<td id=' + ('temp-' + (+id_num[0] + 1) + '-' + i) + ' class="droppable ui-droppable"></td>')
                $("#" + ('temp-' + (+id_num[0] + 1) + '-' + i)).droppable(droppable_prop);
            }
        }
    });
}

// ドロッパブル位置を計算・余分なセルを削除・番号振り分け
function allocateId() {
    // ２列以上の空列は存在しないはず
    var row_size = $("tr").length;
    for (var i = row_size; i > 0; i--) {
        tr_element = $("tr")[i];
        if ($(tr_element).children().children("li").length == 0 && $(tr_element).next().children().children("li").length == 0) {
            $(tr_element).next().detach();
        }
    }
    // 一列目は空列
    if ($("tr:first").find("li").length > 0) {
        $("tr:first").before("<tr></tr>");
        $("tr:first").append('<td id=0-0 class="droppable ui-droppable"></td>');
    }
    // 番号振り分け
    $("tr").each(function (row, tr_element) {
        $(tr_element).children("td").each(function (column, td_element) {
            $(td_element).attr({
                'id': row + "-" + column,
            })
            $('#' + row + '-' + column).droppable(droppable_prop);
        });
    });
    // 常に下側にdroppable領域があるように
    $("td").each(function (index, element) {
        if ($(element).children("li").length > 0) {
            id_num = $(element).attr("id");
            id_num = id_num.split("-");
            if ($("#" + (+id_num[0] + 1) + '-' + id_num[1]).length == 0) {
                $(element).closest("tr").next().append('<td id=' + ((+id_num[0] + 1) + '-' + id_num[1]) + ' class="droppable ui-droppable"></td>')
                $("#" + ((+id_num[0] + 1) + '-' + id_num[1])).droppable(droppable_prop);
            }
        }
    });
    // 空列の高さは狭く
    $("tr").each(function (index, element) {
        if ($(element).find("li").length == 0) {
            $(element).attr("class", "empty");
            $(element).children().height(15);
        } else {
            $(element).removeAttr("class");
        }
    });
    // 置けうる場所にのみdroppable
    $("td").droppable({ disabled: true });
    $("td").css({ "background-color": "rgba(25, 24, 23, 0.1)" });
    $("tr:first").children("td").droppable({ disabled: false }); // 最初は絶対droppable
    $("tr:first").children("td").css({ "background-color": "rgba(135, 206, 250, 0.4)" });
    $("td").each(function (index, element) {
        if ($(element).find("li").length > 0) {
            id_num = $(element).attr("id");
            id_num = id_num.split("-");
            if ($("#" + (id_num[0]) + '-' + id_num[1]).find("li").children("div").hasClass("block-module") != 1) {
                $("#" + (+id_num[0] + 0) + '-' + (+id_num[1] + 1)).droppable({ disabled: false });  // 右は、ブロックでなければdroppable
                $("#" + (+id_num[0] + 0) + '-' + (+id_num[1] + 1)).css({ "background-color": "rgba(135, 206, 250, 0.2)" });
            }
            if ($("#" + (+id_num[0] + 0) + '-' + (+id_num[1] + 1)).find("li").length == 0) {
                $("#" + (+id_num[0] + 1) + '-' + (+id_num[1] + 0)).droppable({ disabled: false }); // 下は、右側に要素がなければdroppable;
                $("#" + (+id_num[0] + 1) + '-' + (+id_num[1] + 0)).css({ "background-color": "rgba(135, 206, 250, 0.2)" });
            } else {
                // 下は、一つ下から左下方向に走査し、要素があれば、その要素のひとつ上の列がdroppable
                $("td").each(function (index, element) {
                    if ($(element).find("li").length > 0) {
                        id_num1 = $(element).attr("id");
                        id_num1 = id_num1.split("-");
                        for (var i = 1; i < $("tr").length - id_num1[0]; i++) {
                            for (var j = 0; j < id_num1[1] + 1; j++) {
                                if ($("#" + (+id_num1[0] + i) + '-' + (+id_num1[1] - j)).find("li").length > 0) {
                                    $("#" + (+id_num1[0] + i - 1) + '-' + (+id_num1[1])).droppable({ disabled: false });
                                    $("#" + (+id_num1[0] + i - 1) + '-' + (+id_num1[1])).css({ "background-color": "rgba(135, 206, 250, 0.2)" });
                                }

                            }
                        }
                    }
                });
                $("tr:last").children("td").each(function (index, element) {
                    $(element).droppable({ disabled: false }); //　ただし一番したは常にdroppable
                    $(element).css({ "background-color": "rgba(135, 206, 250, 0.2)" });
                });
            }
            $(element).droppable({ disabled: true }); //　ただしブロックは重ならないように
            $(element).css({ "background-color": "rgba(25, 24, 23, 0.1)" });
        }
    });
    // 列の一番後ろだけが空白になるように
    $('tr').each(function (index, element) {
        if ($(element).find("li").length > 0) {
            while (true) {
                if ($(element).children().length < 1) {
                    break;
                } else if ($(element).children().last().children("li").length == 0 && $(element).children().last().prev().children("li").length == 0) {
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
    if (lineflag == 1) {
        $.each(line_array, function (index, element) {
            element.remove();
            line_array = [];
        });
    }
    line_array.push(new LeaderLine(
        document.getElementById("start-block"),
        document.getElementById("end-block"),
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

    $("td").each(function (index, element) {

        // 分岐仕様変更のため削除
        //// 横につながっていたら線を引く ただしブランチなら別
        //if ($(element).children("li").children("div").hasClass("block-branch")) {
        //    var followblock_distance = 0;
        //    // 走査
        //    var num_branch = $(element).attr("id");
        //    num_branch = num_branch.split("-");
        //    num1_branch = num_branch[0];
        //    num2_branch = num_branch[1];
        //    //console.log( getId(num1_branch, num2_branch) + "はブランチ" );
        //    branches = $(element).children("li").children("div").attr("branch").split("|")
        //    // console.log(branches)
        //    if ($(getId(num1_branch, +num2_branch + 1)).find("li").length > 0) {
        //        //console.log( getId(num1_branch, +num2_branch+1) + "は存在" );
        //        branch_count = 0
        //        for (var i = 0; i < $("tr").length - num1_branch - 1; i++) {
        //            console.log(branches[branch_count])
        //            if (branches.length <= branch_count) {
        //                branches[branch_count] = "undefined"
        //            }
        //            var flg = (isFollowing(+num1_branch + i, +num2_branch + 1) == 1 || i == 0);
        //            if ($(getId(+num1_branch + i, +num2_branch + 1)).find("li").length > 0 && flg) {
        //                //console.log(getId(num1_branch, +num2_branch+1) +"の下に"+ getId(+num1_branch+i, +num2_branch+1) + "を発見");
        //                line_array.push(new LeaderLine(
        //                    document.getElementById($(element).children("li").children("div").attr("id")),
        //                    document.getElementById($(getId(+num1_branch + i, +num2_branch + 1)).find("li").children("div").attr("id")),
        //                    {
        //                        color: 'rgba(12, 10, 9, 1.0)',
        //                        size: 1,
        //                        startSocket: 'right',
        //                        endSocket: 'left',
        //                        startPlug: 'behind',
        //                        endPlug: 'behind',
        //                        path: 'straight',
        //                        endLabel: LeaderLine.captionLabel({
        //                            text: branches[branch_count],
        //                            offset: [5, -40]
        //                        }),
        //                    }
        //                ));
        //                branch_count++;
        //            }
        //            if (flg == 0) {
        //                break;
        //            }

        //        }
        //    }
        //    // ブランチじゃないなら普通に横に線を引く
        //} else
        if ($(element).children("li").length > 0 && $(element).next().children("li").length > 0) {
            line_array.push(new LeaderLine(
                document.getElementById($(element).children("li").children("div").attr("id")),
                document.getElementById($(element).next().children("li").children("div").attr("id")),
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
        // 同上・ 分岐仕様変更により削除
        // 左か左上の要素が、ブランチなら先はひかない
        //for (var i = 0; i < id_num_forline[0]; i++) {
        //    if ($(getId(id_num_forline[0] - i, id_num_forline[1] - 1)).find("li").children("div").hasClass("block-branch")) {
        //        return;
        //    } else if ($(getId(id_num_forline[0] - i, id_num_forline[1] - 1)).find("li").length > 0) {
        //        break;
        //    }
        //}
        // 下のブロックがなんブロック離れているか取得
        if ($("#" + (+id_num_forline[0]) + '-' + (+id_num_forline[1] + 0)).find("li").length > 0) {
            for (var i = 1; i < $("tr").length - id_num_forline[0]; i++) {
                if ($("#" + (+id_num_forline[0] + i) + '-' + (+id_num_forline[1] + 0)).find("li").length > 0) {
                    followblock_distance = i;
                    break;
                }
            }
        }
        // 下に続くブロックが左側になにもないブロックであれば線を引く
        if (followblock_distance > 0 && $("#" + (+id_num_forline[0] + 0) + '-' + (+id_num_forline[1] + 0)).find("li").length > 0 && $("#" + (+id_num_forline[0] + followblock_distance) + '-' + (+id_num_forline[1] + 0)).find("li").length > 0) {
            for (var i = 1; i <= id_num_forline[1]; i++) {
                if ($('#' + (+id_num_forline[0] + followblock_distance) + '-' + (+id_num_forline[1] - i)).find("li").length > 0) {
                    isFollowing_flag = 0;
                }
            }
            if (isFollowing_flag == 1) {
                line_array.push(new LeaderLine(
                    document.getElementById($('#' + (+id_num_forline[0]) + '-' + (+id_num_forline[1])).find("li").children("div").attr("id")),
                    document.getElementById($('#' + (+id_num_forline[0] + followblock_distance) + '-' + (+id_num_forline[1])).find("li").children("div").attr("id")),
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
    $(".block-module, .block-submodule, .block-branch, .block-loop, .block-ptloop").each(function (index, element) {
        block_touch_num.push(0);
        block_hover_time.push(0);
        // $(element).parent().attr({
        //     'id': index
        // });
    });
}
// ajax_test_createTable
function createTable() {
    var now = new Date();
    table_name = kadai + (now.getMonth() + 1) + "月" + now.getDate() + "日" + now.getHours() + "時" + now.getMinutes() + "分" + user;
    table_name.toString();
    time_stamp = $.now();
    $.ajax({
        type: "POST",
        url: "ajax_test_createTable.php",
        datatype: "json",
        data: {
            'user': user,
            'kadai': kadai,
            'time_stamp': time_stamp,
            'tab1_time': tab1_time,
            'tab2_time': tab2_time,
            'tab3_time': tab3_time,
            'tab4_time': tab4_time,
            'copy_num': copy_num,
            'compile_num': compile_num,
            'block_touch_num': block_touch_num,
            'block_hover_time': block_hover_time,
            'table_name': table_name,
            'json': jsonString
        },
        //通信が成功した時
        success: function (data) {
            $('#pad-console').append("通信せいこーっ☆☆☆");
            $('.pad-editor').before('<div class="tuushin"></div>');
            // console.log(data);
        },
        error: function (data) {
            $('#pad-console').append("通信しっぱい…(´・ω・｀)");
            // console.log(data);
        }
    });
};
let tuushin_count = 0;
function dataUpload() {
    time_stamp = $.now();
    $.ajax({
        type: "POST",
        url: "ajax_test_add.php",
        datatype: "json",
        data: {
            'user': user,
            'kadai': kadai,
            'time_stamp': time_stamp,
            'tab1_time': tab1_time,
            'tab2_time': tab2_time,
            'tab3_time': tab3_time,
            'tab4_time': tab4_time,
            'copy_num': copy_num,
            'compile_num': compile_num,
            'block_touch_num': block_touch_num,
            'block_hover_time': block_hover_time,
            'table_name': table_name,
            'json': jsonString
        },
        //通信が成功した時
        success: function (data) {
            $('#pad-console').append("通信せいこーっ♪");

            // 通信ステータス表示有無！！！！！！！
            $('.tuushin').css({
                "display": "none"
            })

            $('.tuushin').empty();

            $('.tuushin').append(tuushin_count + 1 + "回目" + ($.now() - start_time) / 1000 + "秒経過　◇　通信中");
            for (var i = 0; i < tuushin_count % 4; i++) {
                $('.tuushin').append("...");
            }
            tuushin_count += 1;

            console.log(data);
        },
        error: function (data) {
            $('#pad-console').append("通信しっぱい…");
            // alert(($.now() - start_time) / 1000 + "秒目◇通信失敗しました！！！");
            $('.pad-editor').css({
                "background-color": "red"
            })
            // console.log(data);
        }
    });
};

function paiza_api_create() {
    source = jsonString;
    input_value = document.getElementById("std_input").value; //未実装！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
    $.ajax({
        type: "POST",
        url: "http://api.paiza.io/runners/create",
        datatype: "json",
        data: {
            "source_code": source,
            "language": "c",
            "input": input_value,
            "api_key": "guest"
        }
    }).done(function(data) {
        // console.log(data.id);
        sleep(100);
        while(true) {
            sleep(100);
            stat = paiza_get_status(data.id);
            console.log(stat);
            if(stat.status == "completed"){
                break;
            }
        }
        details = paiza_get_details(data.id);
        if(details.build_stderr.length > 0) {
            $("#compiler_output").css({
                "color": "red"
            });
            $("#compiler_output").val(details.build_stderr);
        } else if(details.stdout.length  > 0) {
            $("#compiler_output").val(details.stdout);
            $("#compiler_output").css({
                "color": "black"
            });
        }

    }).fail(function(data) {
        console.log("Ajax fail (communication error)")
    });
}

function paiza_get_status(id) {
    $.ajax({
        type: "GET",
        async: false,
        url: "http://api.paiza.io/runners/get_status",
        datatype: "json",
        data: {
            "id": id,
            "api_key": "guest"
        }
    }).done(function(data) {
        // console.log(data)
        ret = data;
    }).fail(function(data) {
        console.log("Ajax fail (get_status error)")
        ret = null;
    })

    return ret;
}

function paiza_get_details(id) {
    $.ajax({
        type: "GET",
        async: false,
        url: "http://api.paiza.io/runners/get_details",
        datatype: "json",
        data: {
            "id": id,
            "api_key": "guest"
        }
    }).done(function(data) {
        // console.log(data)
        details = data;
    }).fail(function(data) {
        console.log("Ajax fail (get_status error)")
        details = null;
    })
    return details;
}

function sleep(waitMsec) {
  var startMsec = new Date();

  // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
  while (new Date() - startMsec < waitMsec);
}

// .questionファイルから問題データを読み込み
function loadKadai() {
    name = decodeURIComponent(location.search.split("=")[1]);
    kadai = num;
    str = "./saiyou_mondai/" + name + ".question";
    $.get(str, function (text) {
        // 正答読み込み
        var s_start = text.indexOf("<answer>") + 8;
        var s_end = text.indexOf("</answer>");
        s_answer = text.slice(s_start, s_end);
        // 問題文
        var s_start = text.indexOf("<question>") + 10;
        var s_end = text.indexOf("</question>");
        var s_question = text.slice(s_start, s_end).replace(/\n/g, "<br>");
        $(".pad-question").html(s_question);
        // ブロック読み込み
        // text = text.replace(/\r?\n/g, '');
        s_start = text.indexOf("<block>") + 7;
        s_end = text.indexOf("</block>");
        var block_part = (text.slice(s_start, s_end));
        console.log(block_part);
        block_part = block_part.replace(/\r/g, '\\r');
        block_part = block_part.replace(/\n/g, '\\n');
        block_part = block_part.replace(/!!/g, '!!\n');
        console.log(block_part);
        var s_blocks = block_part.split("!!\n");
        var s_block;
        var block_html;
        var id = 0;
        for (var i = 0; i < s_blocks.length - 1; i++) {
            s_block = s_blocks[i].replace(/^\\r\\n/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split("$");
            s_block[1] = s_block[1].replace(/;(\s)*\\r\\n/g, ";<br>"); // 表示上、実際の改行をbrに
            s_block[1] = s_block[1].replace(/#(.*?)\\r\\n/g, "#$1<br>"); // 表示上、実際の改行をbrに
            // console.log(s_block);
            // console.log(s_block[0] + ", " + s_block[1] + ", " + s_block[2] + ";");
            obj = s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">');
            temp_i = id;
            var switch_flag = 1;
            $(".draggable").each(function(index, element){
                if(obj == element.innerText) {
                    // console.log(obj + "は重複しています");
                    // console.log(element);
                    temp_i = $(element).attr("id");
                    // console.log(temp_i);
                    switch_flag = 0;
                    return false;
                } else {
                    switch_flag = 1;
                }
            });
            // console.log(temp_i + ", " + obj);

            switch (s_block[0]) {
                case 'block':
                    block_html = "<li class='draggable' id=" + i + " isoid=" + temp_i + "><div id='block-" + i + "' class='block-module block'><p class='module-name'>" + s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">'); +"</p></div></li>";
                    break;
                case 'submodule':
                    block_html = "<li class='draggable' id=" + i + " isoid=" + temp_i + "><div id='block-" + i + "' class='block-submodule block'><p class='module-name'>" + s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">'); +"</p></div></li>";
                    break;
                case 'loop':
                    block_html = "<li class='draggable' id=" + i + " isoid=" + temp_i + "><div id='block-" + i + "' class='block-loop block'><p class='module-name'>" + s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">'); +"</p></div></li>";
                    break;
                case 'branch':
                    block_html = "<li class='draggable' id=" + i + " isoid=" + temp_i + "><div id='block-" + i + "' class='block-branch block' branch=" + s_block[3] + "><p class='module-name'>" + s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">'); +"</p></div></li>";
                    break;
                case 'ptloop':
                    block_html = "<li class='draggable' id=" + i + " isoid=" + temp_i + "><div id='block-" + i + "' class='block-ptloop block'><p class='module-name'>" + s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">'); +"</p></div></li>";
                    break;
            }

            // テキストが更新されたら取得
            $(document).on({
                'change': function () {
                    getJsonString();
                }
            }, ".input-text");
            // console.log(block_html);
            $(".pad-blockzone-in").children(".sortable").append(block_html);
            /*      $("#block-"+i).balloon({
                        contents: s_block[2]
                  });
            */
            // 既存のブロックにポップアップを設定
            $("#block-" + temp_i).balloon({
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

            if (switch_flag) id++;
        }
    });
    // ランダムに並び替え
    var bool = [1, -1];
    $('#draggable1').html(
        $(".draggable").sort(function(a, b) {
            return bool[Math.floor(Math.random() * bool.length)];
        })
    )
}

function drawBranchline() {
    // $("#graphics_container").css({
    //     top: $(".pad-line").offset().top,
    //     left: $(".pad-line").offset().left
    // });

    // acgraph.events.removeAll(linePath);
    // linePath.parent(stage);
    // linePath.moveTo(150, 150);
    // linePath.lineTo(50, 10, 50, 50, 10, 50).fill("blue");
    // linePath.close();

    // $("td").each(function(index, element){
    //     // ブランチが下に続いていれば同じブロックのように見せかける
    //     if ($(element).children("li").children("div").hasClass("block-branch")) {
    //         // ブランチの下にブランチが続いているか走査
    //         var id = $(element).attr("id");
    //         var followblock_distance = -1;
    //         id = id.split("-");
    //         if ($(getId(id[0], id[1])).find("li").length > 0) {
    //             for (var i = 1; i < $("tr").length - id[0]; i++) {
    //                 // console.log(+id[0] + i+","+ id[1])
    //                 // console.log($(getId(+id[0] + i, +id[1])).find("li").length);
    //                 if ($(getId(+id[0] + i, +id[1])).children("li").children("div").hasClass("block-branch")) {
    //                     followblock_distance = i;
    //                     // ここに図形描画のコード
    //                     break;
    //                 } else if ($(getId(+id[0] + i, +id[1])).find("li").length > 0) {
    //                     break;
    //                 }
    //             }
    //         }
    //         if (followblock_distance > 0) {
    //             console.log(followblock_distance + "先に分岐ぶろっくがあります．");
    //             console.log($(getId(id[0], id[1])).find("p").text());
    //             console.log($(getId(parseInt(id[0])+parseInt(followblock_distance), id[1])).find("p").text());
    //             console.log(parseInt(id[0])+parseInt(followblock_distance) +", "+ id[1])
    //         }

    //         /* TODO */
    //     }
    
    // });

    //
    $(".block-branch").each(function(index, element){
        // console.log($(element).children("p").html());
        height = $(element).parent().height();

        $(element).children("div").filter(":first").remove();
        $(element).children("div").filter(":last").remove();

        before = $(element).prepend("<div></div>");
        
        before.children("div").filter(":first").css({
            "content": "",
            "position": "absolute",
            "right": "-15px",
            "bottom": "-1px",
            "width": "0px",
            "border-style": "solid",
            "border-color": "#000000",
            "border-width": height/2 + "px 15px "+height/2+"px 0",
            "border-right-color": "transparent",
        });

        after = $(element).append("<div></div>")
        
        after.children("div").filter(":last").css({
            "content": "",
            "position": "absolute",
            "right": "-14px",
            "bottom": "0px",
            "width": "0px",
            "border-style": "solid",
            "border-color": "#99bbfd",
            "border-width": (height/2-1) + "px 15px "+(height/2-1)+"px 0",
            "border-right-color": "transparent",
        });


    });
    // end-blockの場所調整
    if(parseInt($("#draggable2").css("height")) + parseInt($("#draggable2").offset().top) != 0) {
        $("#end-block").css({
            "margin-top": parseInt($("#draggable2").css("height")) + parseInt($("#draggable2").offset().top)
        });    
    } else {
        $("#end-block").css({
            "margin-top": "100px"
        });
    }

    return 0;
}
// canvasの大きさを動的に変更
// うまく動かないので廃止
// function drawBranchline() {


//     $('canvas').each(function (index, element) {
//         var w = $(element).parent().outerWidth(true);
//         var h = $(element).parent().outerHeight(true);
//         $(element).attr('width', w);
//         $(element).attr('height', h);

//         $.jCanvas.defaults.fromCenter = false;
//         $(element).clearCanvas();
//         $(element).drawLine({
//             strokeStyle: "black",
//             strokeWidth: "1",
//             x1: $(element).closest('.block-branch').width(),
//             y1: 0,
//             x2: $(element).closest('.block-branch').width() - 20,
//             y2: $(element).closest('.block-branch').height() / 2
//         });
//         $(element).drawLine({
//             strokeStyle: "black",
//             strokeWidth: "1",
//             x1: $(element).closest('.block-branch').width() - 20,
//             y1: $(element).closest('.block-branch').height() / 2,
//             x2: $(element).closest('.block-branch').width(),
//             y2: $(element).closest('.block-branch').height()
//         });
//     });
// };
function showInfo() {
    $("#stage-info").html("<h2>" + user + "さん</h2>");
    $("#stage-info").append("<p>問題文：" + tab1_time / 100 + "秒<br>" +
        "PAD：" + tab2_time / 100 + "秒<br>" +
        "実行：" + tab3_time / 100 + "秒<br>" +
        "非アクティブ：" + tab4_time / 100 + "秒</p>");
    $("#stage-info").append("<p>処理時間：" + Math.round(($.now() - start_time) / 1000 * 100)/100 + "秒</p>");
    $("#stage-info").append("<p>経過時間：" + Math.round((tab1_time + tab2_time + tab3_time + tab4_time)/100 * 100)/100 + "秒</p>");
}

var passageTab1;
var passageTab2;
var passageTab3;
var passageTab4;
function tab1_countStart() {
    if (passageTab1 == null) {
        passageTab1 = setInterval(function () {
            tab1_time += 1;
        }, 10);
    } else {
        return false;
    }
}
function tab2_countStart() {
    if (passageTab2 == null) {
        passageTab2 = setInterval(function () {
            tab2_time += 1;
        }, 10);
    } else {
        return false;
    }
}
function tab3_countStart() {
    if (passageTab3 == null) {
        passageTab3 = setInterval(function () {
            tab3_time += 1;
        }, 10);
    } else {
        return false;
    }
}

function tab1_countStop() {
    clearInterval(passageTab1);
    passageTab1 = null;
}
function tab2_countStop() {
    clearInterval(passageTab2);
    passageTab2 = null;
}
function tab3_countStop() {
    clearInterval(passageTab3);
    passageTab3 = null;
}

function getJsonString() {
    prev_jsonString = jsonString

    temp_jsonString = "";
    temp_jsonString_innerText = "";
    //temp_jsonString = "{\n"; //最上層
    //temp_jsonString_innerText = "{\n"

    var tab_count = 0;
    searchFollowing(1, 0, tab_count);

    //temp_jsonString = temp_jsonString + "}\n"; //最上層
    //temp_jsonString_innerText += "}\n"

    // 採点機能追加のため廃止
    jsonString = temp_jsonString_innerText;

    // replace
    // HTML用の文字コードをプログラム用に再変換
    jsonString = jsonString.replace(/'/g, "''").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/<br>/g, "\n");


    $("#serialize_output").val(jsonString);


}

// 階層を走査してtime_jsonStringに書き込み
function searchFollowing(num1, num2, tab_count) {
    var followblock_distance = 0;
    // 走査
    if ($(getId(num1, num2)).find("li").length > 0) {
        outer_loop:
        for (var i = 0; i < $("tr").length - num1 - 1; i++) {
            var flg = (isFollowing(+num1 + i, num2) == 1 || i == 0);
            if (flg == 0) {
                break;
            }
            if ($(getId(+num1 + i, num2)).find("li").length > 0 && flg) {
                //console.log(getId(num1, num2) +"の下に"+ getId(+num1+i, num2) + "を発見");
                var tab_num = 0;
                for (var j = 0; j < tab_count; j++) {
                    temp_jsonString = temp_jsonString + '\t';
                    temp_jsonString_innerText = temp_jsonString_innerText + '\t';
                    tab_num++;
                }

                var innerContent = $(getId(+num1 + i, num2)).find("p").html();
                // inputを文字列に置き換える 一時的に！！
                $(getId(+num1 + i, num2)).find("p").find("input").each(function (index, element) {
                    var s_start = innerContent.indexOf("<input");
                    var s_end = innerContent.indexOf(">") + 1;
                    if (s_start !== -1 && s_end !== -1) {
                        var s_input = innerContent.slice(s_start, s_end);
                        innerContent = innerContent.replace(s_input, $(element).val());
                    }
                });

                // elseなら前の行の改行を消す
                if (innerContent.match(/else/)) {
                    len = temp_jsonString_innerText.length;
                    len2 = temp_jsonString.length;
                    if (temp_jsonString_innerText[len - 1] == '\n' && temp_jsonString_innerText[len - 2] == '}') {
                        temp_jsonString_innerText = temp_jsonString_innerText.slice(0, -1);
                        temp_jsonString_innerText = temp_jsonString_innerText + " ";
                    }
                    if (temp_jsonString[len2 - 1] == '\n' && temp_jsonString[len2 - 2] == '}') {
                        temp_jsonString = temp_jsonString.slice(0, -1);
                        temp_jsonString = temp_jsonString + " ";
                    }
                    innerContent = innerContent + " ";
                }
                
                //複数行あるコードのタブを揃えるよ
                var lineincontents = innerContent.split("<br>");
                for(var l=1; l<lineincontents.length; l++) {
                    for(var j=0; j<tab_num; j++) {
                        lineincontents[l] = '\t' + lineincontents[l];
                    }
                    // console.log(lineincontents[l])
                }
                innerContent = lineincontents.join("\r\n");
                // console.log(tab_num);
                // console.log(innerContent);
                temp_jsonString_innerText = temp_jsonString_innerText + innerContent + "\n";
                temp_jsonString = temp_jsonString + $(getId(+num1 + i, num2)).find("li").find("div").attr("id") + "\n";

                if ($(getId(+num1 + i, +num2 + 1)).find("li").length > 0) {
                    //console.log(getId(+num1+i, num2) +"の横に"+ getId(+num1+i, +num2+1) + "は存在");
                    temp_jsonString = insertStr(temp_jsonString, temp_jsonString.length - 1, "{")
                    temp_jsonString_innerText = insertStr(temp_jsonString_innerText, temp_jsonString_innerText.length - 1, "{")
                    searchFollowing(+num1 + i, +num2 + 1, tab_count + 1);
                    for (var j = 0; j < tab_count; j++) {
                        temp_jsonString = temp_jsonString + '\t';
                        temp_jsonString_innerText = temp_jsonString_innerText + '\t';
                    }
                    temp_jsonString = temp_jsonString + '}\n';
                    temp_jsonString_innerText = temp_jsonString_innerText + '}\n'
                } else {

                }
                followblock_distance = i;
            }
        }
    }
}
function insertStr(str, index, insert) {
    return str.slice(0, index) + insert + str.slice(index, str.length);
}
function getId(num1, num2) {
    return '#' + num1 + '-' + num2;
}
function isFollowing(num1, num2) {
    var isFollowing_f = 1;
    for (var i = 1; i <= num2; i++) {
        if ($(getId(num1, +num2 - i)).find("li").length > 0) {
            isFollowing_f = 0;
        }
    }
    return isFollowing_f;
}

function hideLine() {
    $.each(line_array, function (index, element) {
        element.hide("none");
    });
}
function showLine() {
    $.each(line_array, function (index, element) {
        element.show("none");
    });
}

var num = 0;
$(function () {
    var hoverFlag = 0;
    // 新たなブロックを追加（デバック用）
    $('#new-block-btn').on('click', function () {
        var module_style = $('input[name="module-style"]:checked').val();
        var balloon = $('#new-block-balloon').val();
        var name = $('#new-block-name').val();
        var dom = "<li><div id='id-" + num + "' class='" + module_style + " block' alt='" + balloon + "'><p>" + name + "</p></div><ol></ol></li>";
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
        num = num + 1;
    });
    // resizeされたら分岐の枠線を合わせて変形
    $(window).on('load resize', function () {
        console.log("ウィンドウサイズ変更");
        drawBranchline();
    });

    // タブボタンによる表示切り替えや時間計測の切り替え
    $(".tab_area label").on("click", function () {
        var $th = $(this).index();
        $(".tab_label").removeClass("active");
        $(".tab_panel").removeClass("active");
        $(this).addClass("active");
        $(".tab_panel").eq($th).addClass("active");
        if ($(this).index() == 0) {
            tab1_countStop();
            tab2_countStop();
            tab3_countStop();
            tab1_countStart();
            hideLine();
        } else if ($(this).index() == 1) {
            tab1_countStop();
            tab2_countStop();
            tab3_countStop();
            tab2_countStart();
            showLine();
        } else if ($(this).index() == 2) {
            tab1_countStop();
            tab2_countStop();
            tab3_countStop();
            tab3_countStart();
            hideLine();
        }
    });

    $(".block_tab_label").on("click", function(){
        var index = $(this).index();
        $(".block_tab_label").removeClass("block_selected");
        $(this).addClass("block_selected");

        $(".draggable>.block").removeClass("hidden");
        drawBranchline();
        switch(index) {
            case 0:
                // $(".pad-blockzone-in .draggable>.block-module").addClass("hidden");
                // $(".pad-blockzone-in .draggable>.block-branch").addClass("hidden");
                // $(".pad-blockzone-in .draggable>.block-loop").addClass("hidden");
                // $(".pad-blockzone-in .draggable>.block-bloop").addClass("hidden");
                // $(".pad-blockzone-in .draggable>.block-submodule").addClass("hidden");

                break;
            case 1:
                // $(".pad-blockzone-in .draggable>.block-module").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-branch").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-loop").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-bloop").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-submodule").addClass("hidden");
                break;
            case 2:
                $(".pad-blockzone-in .draggable>.block-module").addClass("hidden");
                // $(".pad-blockzone-in .draggable>.block-branch").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-loop").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-bloop").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-submodule").addClass("hidden");
                break;
            case 3:
                $(".pad-blockzone-in .draggable>.block-module").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-branch").addClass("hidden");
                // $(".pad-blockzone-in .draggable>.block-loop").addClass("hidden");
                // $(".pad-blockzone-in .draggable>.block-bloop").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-submodule").addClass("hidden");
                break;
            case 4:
                $(".pad-blockzone-in .draggable>.block-module").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-branch").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-loop").addClass("hidden");
                $(".pad-blockzone-in .draggable>.block-bloop").addClass("hidden");
                // $(".pad-blockzone-in .draggable>.block-submodule").addClass("hidden");
        }
    })

    // 画面を閉じている時間を計測
    // document.addEventListener('webkitvisibilitychange', function(){
    //     if ( document.webkitHidden ) {
    //         tab1_countStop();
    //         tab2_countStop();
    //         tab3_countStop();
    //         hidden_time = $.now();
    //     } else {
    //         tab1_countStop();
    //         tab2_countStop();
    //         tab3_countStop();
    //         tab4_time += ($.now() - hidden_time)/10;
    //         switch($(".tab_label").index($(".active"))) {
    //             case 0:
    //                 tab1_countStart();
    //                 break;
    //             case 1:
    //                 tab2_countStart();
    //                 break;
    //             case 2:
    //                 tab3_countStart();
    //                 break;
    //         }
    //     }
    // }, false);

    // 非アクティブ時に画面を非表示にする
    // ウィンドウをフォーカスしたら指定した関数を実行
    window.addEventListener('focus', function(){
        tab1_countStop();
        tab2_countStop();
        tab3_countStop();
        // console.log("The inactive time is " + inactive_time)
        if (inactive_time != null) {
            tab4_time += ($.now() - inactive_time) / 10;

            switch ($(".tab_label").index($(".active"))) {
                case 0:
                    tab1_countStart();
                    break;
                case 1:
                    tab2_countStart();
                    break;
                case 2:
                    tab3_countStart();
                    break;
            }
        }
        $(".popup-content").css({"display": "none"})
    });

    // ウィンドウからフォーカスが外れたら指定した関数を実行
    window.addEventListener('blur', function(){
        tab1_countStop();
        tab2_countStop();
        tab3_countStop();
        // $(".popup-content").css({"display": "table"}); // 非アクティブ時画面表示しない
        if ($(".login-wrapper").hasClass("inactive")) {
            inactive_time = $.now();
        } else {
            inactive_time = null;
        }
    });

    // コードエリアのコピーアンドペーストの禁止
    prevent = 1;
    $('#serialize_output').on('copy cut paste', function(e){
        if(prevent){
            return false;
        } else {
            return true;
        }
    });
    $("#serialize_output").attr("readonly", "readonly");
    $('#serialize_output').on('selectstart contextmenu', function(e){
        return false;
    });
    // クリップボードへコピー
    $('#copy2clipboard').on('click', function(){
        copy_num++;
        prevent = 0;
        $('#serialize_output').select();
        document.execCommand('copy');
        $('#copyalert').show().delay(600).fadeOut(200);
        prevent = 1;
        document.getElementById("copy2clipboard").disabled = "disabled";
        $(function(){
	        setTimeout(function(){
		    document.getElementById("copy2clipboard").disabled = "";
	    },6000);
        });
    });
    $("#compile_clang").on("click", function(){
        compile_num++;
        paiza_api_create();
        $('#compiler_output').val("");
    });

    // 提出ボタン
    $("#submit-btn").on("click", function () {
        clearInterval(showInfo_interval);
        clearInterval(dataUpload_interval);
        clearInterval(passageTab1);
        clearInterval(passageTab2);
        clearInterval(passageTab3);
        clearInterval(passageTab4);
    });
    $("#panel2").scroll(function () {
        $.each(line_array, function (index, element) {
            element.position();
        });
    });
    // テキストアリアにフォーカスしているのか！？
    var inputAreaFocusing = 0
    var inputting = 0
    var input_start = 0
    var new_this = 0
    var input_element = 0
    $(document).on('focus click', '.input-text', function (e) {
        $(this).css("background-color", "#ffc")
        $(this).closest(".block").hideBalloon();
        inputAreaFocusing = 1;
        // 一定時間入力がなければフォーカスを切る
        input_start = $.now();
        input_element = this
        $(this).on('input', function (e) {
            input_start = $.now();
            $(this).css("background-color", "#fcc")
        })
        if (hoverFlag == 1) {
            hover_time = $.now() - hover_time;
            //$('#pad-console-left').append('<p>' + $.now() + $(this).find("p").text() +  ': Mouse Left</p>');
            //$('#pad-console-left').animate({scrollTop: $('#pad-console-left')[0].scrollHeight}, 0);
            if (hover_time >= 1000) {
                block_hover_time[$(this).closest("li").attr("isoid")] += hover_time;
                $('#pad-console-left').append('<p>' + $(this).find("p").text() + 'の説明を見た秒数' + block_hover_time[$(this).closest("li").attr("isoid")] + 'ms</p>');
                // console.log(hover_time)
                $('#pad-console-left').animate({ scrollTop: $('#pad-console-left')[0].scrollHeight }, 0);
            }
            hoverFlag = 0;
            hover_time = 0;
        }
        hoverFlag = 0;
        clearTimeout(sethover);
    }).on('blur', '.input-text', function (e) {
        new_this = this;
        inputting = 0;
        hoverFlag = 0;
        setTimeout(function () {
            $(new_this).css("background-color", "white")
            inputAreaFocusing = 0;
        }
            , 800)
    })
    toolongFocus = setInterval(function () {
        var time = $.now() - input_start;
        $("#stage_info").append(time)
        if (time >= 10000 && inputAreaFocusing == 1) {
            inputting = 0
            $(input_element).css("background-color", "white")
            inputAreaFocusing = 0;
            $(input_element).blur();
            hoverFlag = 0;
        } else if (0 < time && time < 10000) {
            $(input_element).closest(".block").hideBalloon();
        }
    }, 500);
    /*
    .focusin(function(element){
      $(this).css("background-color", "red")
      inputAreaFocusing = 1;
    })
    .focusout(function(element){
      setTimeout(function(){
        inputAreaFocusing = 0;
      }
      , 800)
    });
    */
    // 要素にマウスオーバーしている時間を取得
    var hover_time;
    var now_dragging = 0;
    $(document).on({
        'mouseenter': function () {
            sethover = setTimeout(function () {
                hover_time = $.now();
                //$('#pad-console-left').append('<p>' + $.now() + $(this).find("p").text() + ': Mouse Entered</p>');
                //$('#pad-console-left').animate({scrollTop: $('#pad-console-left')[0].scrollHeight}, 0);
                hoverFlag = 1;
            }, 1000);
        },
        'mouseleave': function () {
            if (hoverFlag == 1) {
                hover_time = $.now() - hover_time;
                //$('#pad-console-left').append('<p>' + $.now() + $(this).find("p").text() +  ': Mouse Left</p>');
                //$('#pad-console-left').animate({scrollTop: $('#pad-console-left')[0].scrollHeight}, 0);
                if (hover_time >= 1000 && inputAreaFocusing == 0) {
                    block_hover_time[$(this).closest("li").attr("id")] += hover_time;
                    $('#pad-console-left').append('<p>' + $(this).find("p").text() + 'の説明を見た秒数' + block_hover_time[$(this).closest("li").attr("id")] + 'ms</p>');
                    // console.log(hover_time)
                    $('#pad-console-left').animate({ scrollTop: $('#pad-console-left')[0].scrollHeight }, 0);
                }
                hoverFlag = 0;
                hover_time = 0;
            }
            clearTimeout(sethover);
        }
    }, '.block');
    // マウスダウンしたらバルーンは隠す
    $(document).on('mousedown', '.block', function () {
        $(this).hideBalloon();
        if (hoverFlag == 1) {
            hover_time = $.now() - hover_time;
            $('#pad-console-left').append('<p>' + $(this).closest("li").attr("id") + ': Mouse Hovered ' + hover_time + 'ms</p>');
            $('#pad-console-left').animate({ scrollTop: $('#pad-console-left')[0].scrollHeight }, 0);
            hoverFlag = 0;
            hover_time = 0;
        }
    });
    // sortable専用メソッド♪
    var adjustment;
    var dragging;
    $(document).ready(function () {
        // ログインボタン（仮）による画面切り替えと時間計測開始
        $("#login-btn").on("click", function () {
            user = $("#name").val();
            if (user == "") {
                $(".login").children("h3").css({
                    'color': 'red',
                });
            } else {
                $(".login-wrapper").addClass("inactive")
                $("#stage-info").css({
                    'display': 'none',
                    //'display': 'hidden'
                });
                $(".debug-console").css({
                    'display': 'none'
                    //          'display': 'none'
                });
                // 問題文など各種読み込み
                loadKadai();
                // stage = acgraph.create('graphics_container');
                setTimeout(function(){
                    drawBranchline();
                }, 40)
                setTimeout(function () {
                    tab1_countStart();
                    start_time = $.now();
                    //          var data = group.sortable("serialize").get();
                    //          jsonString = JSON.stringify(data, null, ' ');
                    createArray();
                    createTable();
                    myDraggable();
                    mySortable();
                }, 500);
                // ☆5秒？？？？ごとにデータを収集☆
                dataUpload_interval = setInterval('dataUpload()', 5000);
                showInfo_interval = setInterval('showInfo()', 10);
            }
        });
        $(".tab_panel").eq(1).addClass("active");
        $(".tab_panel").eq(2).addClass("active");
        $(".tab_panel").eq(3).addClass("active");
        $(".tab_label").removeClass("active");
        $(".tab_panel").removeClass("active");
        $(".tab_label").eq(0).addClass("active");
        $(".tab_panel").eq(0).addClass("active");

    });

});

setInterval(function(){
    $(".debugzone").empty()
    $(".debugzone").append("<p>問題文視聴時間</p>");
    $(".debugzone").append(tab1_time);
    $(".debugzone").append("<p>作図時間</p>");
    $(".debugzone").append(tab2_time);
    $(".debugzone").append("<p>コード・実行画面視聴時間</p>");
    $(".debugzone").append(tab3_time);
    $(".debugzone").append("<p>非アクティブ時間</p>");
    $(".debugzone").append(tab4_time);
    $(".debugzone").append("<p>コピー回数</p>");
    $(".debugzone").append(copy_num);
    $(".debugzone").append("<p>コンパイル回数</p>");
    $(".debugzone").append(compile_num);
    $(".debugzone").append("<p>タッチ回数</p>");
    $(".debugzone").append(block_touch_num);
    $(".debugzone").append("<p>ホバー回数</p>");
    $(".debugzone").append(block_hover_time);
}, 100);
