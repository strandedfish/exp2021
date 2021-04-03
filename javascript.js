/*
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
データ送信用グローバル変数の定義
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
*/
var start_time = 0;

// table名は課題名＋日時＋名前
var table_name = "default";
// 最初に入力するやつ
var user = "default";

// データ送信ごとのタイムスタンプ
var time_stamp = 0;
// 生コード
var culcurated_raw_code = "";
var culcurating_raw_code_id = "";
var culcurating_raw_code = "";
// 解答（多分使わない）
var s_answer = "";
// 各タブ視聴時間
var tab1_time = 0;
var tab2_time = 0;
var tab3_time = 0;
var tab4_time = 0; // 累計ウィンドウ非アクティブ時間
var inactive_time = 0; // 非アクティブ時間保存用
// ソースコードコピー回数（未使用）
var copy_num = 0;
// コンパイル回数
var compile_num = 0;
// 課題のファイル名
var kadai_filename = null;
// 各コード断片のドラッグアンドドロップ回数
var block_touch_num = [];
// 各コード断片のマウスホバー回数（分析には使わないかも）
var block_hover_time = [];

// 各インターバル
var dataUpload_interval;
var showInfo_interval;

// タッチ回数ホバー回数保存用のArrayを定義
function createArray() {
    $(".block-module, .block-submodule, .block-branch, .block-loop, .block-b_loop").each(function (index, element) {
        block_touch_num.push(0);
        block_hover_time.push(0);
        // $(element).parent().attr({
        //     'id': index
        // });
    });
}

// 操作ごとにデータ送信するようにする。
/*
    0．timestamp
    1．なんの操作をしたか（ドラッグ・ドロップ・空欄補充・タブ変更・コンパイル・入力）
    2．操作したブロックID
    2．操作したブロック名前
    3. 空欄
    4．変更タブ
    5．入力
    6．コンパイル結果
    7．生コード
*/
// var timestamp = 0; // 定義済み
var db_event = "null"; // drag, drop, fill, change_tab, compile, input
var db_block_id = "null"; // コードID
var db_block = "null"; // コード名前
var db_blank = "null"; // 空欄内容
var db_tab = "null"; // 1(question), 2(PAD), 3(execute), 4(inactive)
var db_input = "null"; // 入力内容
var db_result = "null"; // 実行結果
var db_raw_code = "null"; // なまこ



/*
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

　ドラッグアンドドロップに関する処理

■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
*/

// 現在ドラッグ中のオブジェクト
// 他の関数からアクセスするのでグローバル
var dragging_object;

// ドラッグできるオブジェクトのプロパティ
var draggable_prop = {
    containment: ".main-wrapper",
    // snap: ".droppable",
    helper: "clone",
    // stack: ".main-wrapper .pad-line",
    zIndex: 1000,
    opacity: 0.3,
    revert: "invalid",
    revertDuration: 500,

    // ドラッグ開始時の処理
    start: function (event, ui) {
        $(this).hide();
        dragging_object = $(this);
        // ログ用変数を更新
        block_touch_num[$(dragging_object).attr("isoid")]++;
        $("#pad-console-right").text(block_touch_num);
        // sql送信
        db_event = "drag";
        db_block_id = $(dragging_object).attr("id");
        db_block = $(dragging_object).find("p").html();
        // console.log(db_event + ", " + db_block_id + ", " + db_block); // OK!
        event_data_upload();
        // ドロップできる位置やブロックIDを再割り当て
        reAllocate_droppable();
    },
    // ドラッグ終了時の処理
    stop: function (event, ui) {
        $(this).show();
        dragging_object = null;
    }
};

// ドロップできるオブジェクトのプロパティ
var droppable_prop = {
    classes: {
        "ui-droppable-hover": "placeholder"
    },
    greedy: true,
    hoverClass: "hilite",
    tolerance: "pointer",

    // ドロップされた時の処理
    drop: function (event, ui) {
        // ドロップされた位置にドラッグ中のオブジェクトを挿入
        $("#" + event.target.id).append(dragging_object);
        dragging_object.css({
            'top': '0px',
            'left': '0px'
        });
        // 配置可能位置の再計算や線の描画や生コードの取得など
        after_drop_procedures(dragging_object, ui);
    }
};

// ドラッグ可能オブジェクトとドロップ可能オブジェクトの定義・設定
function myDraggable() {
    $('.draggable').draggable(draggable_prop);
    $('.droppable').droppable(droppable_prop);
    $('#draggable1').droppable(droppable_prop);
};

/* --------------------------

ここからしばらくドロップ時の処理
class化しろよ

----------------------------- */

/* 基本方針：枠にID（i, j）を割り振り、IDを操作して左右のブロック配置状況を把握する */
var id_num; // 動かした場所の枠のID
var right_id; // 動かした場所の右の枠のID
var bottom_id; // 動かした場所の下の枠のID
var now_dropped_object; // 動かした場所の枠のオブジェクト

// ドロップした場所と近辺の情報を格納し、様々な関数を順番に呼び出す
function after_drop_procedures(dragging_object, ui) {
    id_num = $(dragging_object).parent().attr("id");
    id_num = id_num.split("-");
    right_id = id_num[0] + '-' + (+id_num[1] + 1);
    bottom_id = (+id_num[0] + 1) + '-' + id_num[1];
    now_dropped_object = $(dragging_object).parent();
    /* 必要なら右側に枠を伸ばす */
    extend_column();
    /* 必要なら下側に枠を伸ばす */
    extend_row();
    /* ブロックとブロックの間に挿入するための空行を追加する */
    create_blankline(ui);
    /* 余分な枠の削除・配置可能位置の再割当て */
    setTimeout(function () {
        reAllocate_droppable();
    }, 5);
    /* 描画系 */
    setTimeout(function () {
        draw_branch_border(); // 分岐の複雑な枠を描画してる
        redrawLine(); // 枠と枠の間の線を描画してる
    }, 10);
    /* 移動後の生コードを取得 */
    setTimeout(function () {
        get_raw_code();
        // コピーボタンを開放
        document.getElementById("copy2clipboard").disabled = "";
    }, 50)

    // sql送信
    db_event = "drop";
    db_block_id = $(dragging_object).attr("id");
    db_block = $(dragging_object).find("p").html();
    // console.log(db_event + ", " + db_block_id + ", " + db_block); // OK!
    event_data_upload();
}

// 一行追加
function extend_column() {
    // 要素の数を取得し、足りなければ追加
    if ($("#" + right_id).length == 0 && $(now_dropped_object).closest("table").length > 0) {
        $(now_dropped_object).parent().append('<td id=' + right_id + ' class="droppable ui-droppable"></td>')
        $("#" + right_id).droppable(droppable_prop);
    }
}

// 一列追加
function extend_row() {
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
function create_blankline(ui) {
    $("tr").each(function (index, element) {
        if ($(element).children().children("li").length > 0 && $(element).next().children().children("li").length > 0) {
            id_num = $(dragging_object).parent().attr("id");
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
function reAllocate_droppable() {
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

function draw_branch_border() {
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

var lineflag = 0;
var line_array = [];
function redrawLine() {
    // 前の線をすべて削除
    if (lineflag == 1) {
        $.each(line_array, function (index, element) {
            element.remove();
            line_array = [];
        });
    }
    // startとendのブロックの線を描画
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

    // すべての枠を走査
    $("td").each(function (index, element) {
        // 線を引く
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
        // 下のブロックの左側が存在しなければ（兄弟ブロックであれば）、下のブロックとの間に線を引く
        var id_num_forline = $(element).attr("id");
        id_num_forline = id_num_forline.split("-");
        var followblock_distance = -1;
        var isFollowing_flag = 1;
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

function get_raw_code() {
    culcurating_raw_code_id = ""; // 未使用
    culcurating_raw_code = "";

    var tab_count = 0;
    /* 生コード取得用　再帰関数 */
    /* 結果は culcurating_raw_code に格納されている */
    searchFollowing(1, 0, tab_count);

    culcurated_raw_code = culcurating_raw_code;

    // replace
    // HTML用の文字コードをプログラム用に再変換
    culcurated_raw_code = culcurated_raw_code.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/<br>/g, "\n");
    // .replace(/'/g, "''")

    $("#serialize_output").val(culcurated_raw_code);

    /* culcurated_raw_codeはグローバル変数
       SQL送信時に一緒に送信する
    */

}

// 階層を走査してtime_culcurated_raw_codeに書き込み
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
                    culcurating_raw_code_id = culcurating_raw_code_id + '\t';
                    culcurating_raw_code = culcurating_raw_code + '\t';
                    tab_num++;
                }

                var innerContent = $(getId(+num1 + i, num2)).find("p").html();
                // inputを文字列に置き換える 一時的に！！
                $(getId(+num1 + i, num2)).find("p").find("input").each(function (index, element) {
                    console.log(innerContent);
                    console.log($(element).val());
                    var s_start = innerContent.indexOf("<input");
                    var s_end = innerContent.indexOf('">') + 2;
                    if (s_start !== -1 && s_end !== -1) {
                        var s_input = innerContent.slice(s_start, s_end);
                        innerContent = innerContent.replace(s_input, $(element).val());
                    }
                });

                // elseなら前の行の改行を消す
                if (innerContent.match(/else/)) {
                    len = culcurating_raw_code.length;
                    len2 = culcurating_raw_code_id.length;
                    if (culcurating_raw_code[len - 1] == '\n' && culcurating_raw_code[len - 2] == '}') {
                        culcurating_raw_code = culcurating_raw_code.slice(0, -1);
                        culcurating_raw_code = culcurating_raw_code + " ";
                    }
                    if (culcurating_raw_code_id[len2 - 1] == '\n' && culcurating_raw_code_id[len2 - 2] == '}') {
                        culcurating_raw_code_id = culcurating_raw_code_id.slice(0, -1);
                        culcurating_raw_code_id = culcurating_raw_code_id + " ";
                    }
                    innerContent = innerContent + " ";
                }
                
                //複数行あるコードのタブを揃えるよ
                var lineincontents = innerContent.split("<br>");
                for(var l=1; l<lineincontents.length; l++) {
                    for(var j=0; j<tab_num; j++) {
                        lineincontents[l] = '\t' + lineincontents[l];
                    }
                }
                innerContent = lineincontents.join("\r\n");
                culcurating_raw_code = culcurating_raw_code + innerContent + "\n";
                culcurating_raw_code_id = culcurating_raw_code_id + $(getId(+num1 + i, num2)).find("li").find("div").attr("id") + "\n";

                // もう一段深い階層で同じことをするよ
                if ($(getId(+num1 + i, +num2 + 1)).find("li").length > 0) {
                    culcurating_raw_code_id = insertStr(culcurating_raw_code_id, culcurating_raw_code_id.length - 1, "{")
                    culcurating_raw_code = insertStr(culcurating_raw_code, culcurating_raw_code.length - 1, "{")
                    searchFollowing(+num1 + i, +num2 + 1, tab_count + 1);
                    for (var j = 0; j < tab_count; j++) {
                        culcurating_raw_code_id = culcurating_raw_code_id + '\t';
                        culcurating_raw_code = culcurating_raw_code + '\t';
                    }
                    culcurating_raw_code_id = culcurating_raw_code_id + '}\n';
                    culcurating_raw_code = culcurating_raw_code + '}\n'
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

/* ドロップ後の処理 ここまで */

/*
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    データ送信用AJAX関数
    PHPに一度データを送信し、それを経由してSQLにアクセス
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
*/

// ajax_test_createTable
function createTable() {
    var now = new Date();
    table_name = kadai_filename + "：" + user + "：" + (now.getMonth() + 1) + "月" + now.getDate() + "日" + now.getHours() + "時" + now.getMinutes() + "分";
    table_name.toString();
    time_stamp = $.now();
    $.ajax({
        type: "POST",
        url: "ajax_test_createTable.php",
        datatype: "json",
        data: {
            'user': user,
            'kadai': kadai_filename,
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
            'json': culcurated_raw_code
        },
        //通信が成功した時
        success: function (data) {
            $('#pad-console').append("通信せいこーっ☆☆☆");
            $('.pad-editor').before('<div class="tuushin"></div>');
            console.log(data);
        },
        error: function (data) {
            $('#pad-console').append("通信しっぱい…(´・ω・｀)");
            // console.log(data);
        }
    });
};
let tuushin_count = 0;
function dataUpload() {
    var now = new Date();
    time_stamp = $.now();
    $.ajax({
        type: "POST",
        url: "ajax_test_add.php",
        datatype: "json",
        data: {
            'user': user,
            'kadai': kadai_filename,
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
            'json': culcurated_raw_code
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

            console.log("データ送信成功中…", data);
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

// こちらはn秒ごとではなくイベントごとのデータ
function create_table_event() {
    var now = new Date();
    time_stamp = $.now();

    $.ajax({
        type: "POST",
        url: "ajax_test_createTable_event.php",
        datatype: "json",
        data: {
            'user': user,
            'kadai': kadai_filename,
            'time_stamp': time_stamp,
            'db_event': db_event,
            'db_block_id': db_block_id,
            'db_block': db_block,
            'db_blank': db_blank,
            'db_tab': db_tab,
            'db_input': db_input,
            'db_result': db_result,
            'db_raw_code': db_raw_code,
            'table_name': table_name + "_event"
        },
        //通信が成功した時
        success: function (data) {
            $('#pad-console').append("イベント毎通信せいこーっ☆☆☆");
            $('.pad-editor').before('<div class="tuushin"></div>');
            console.log(data);
        },
        error: function (data) {
            $('#pad-console').append("イベント毎通信しっぱい…(´・ω・｀)");
            // console.log(data);
        }
    });
};

// こちらはn秒ごとではなくイベントごとのデータ
function event_data_upload() {
    var now = new Date();
    time_stamp = $.now();
    db_raw_code = culcurated_raw_code

    $.ajax({
        type: "POST",
        url: "ajax_test_add_event.php",
        datatype: "json",
        data: {
            'user': user,
            'kadai': kadai_filename,
            'time_stamp': time_stamp,
            'db_event': db_event,
            'db_block_id': db_block_id,
            'db_block': db_block,
            'db_blank': db_blank,
            'db_tab': db_tab,
            'db_input': db_input,
            'db_result': db_result,
            'db_raw_code': db_raw_code,
            'table_name': table_name + "_event"
        },
        //通信が成功した時
        success: function (data) {
            $('#pad-console').append("イベント毎通信せいこーっ♪");

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

            console.log("イベント毎データ送信成功中…", data);
        },
        error: function (data) {
            $('#pad-console').append("イベント毎通信しっぱい…");
            // alert(($.now() - start_time) / 1000 + "秒目◇通信失敗しました！！！");
            $('.pad-editor').css({
                "background-color": "red"
            })
            // console.log(data);
        }
    });

    // var timestamp = 0; // 定義済み
    db_event = "null"; // drag, drop, fill, change_tab, compile, input
    db_block_id = "null"; // コードID
    db_block = "null"; // コード名前
    db_blank = "null"; // 空欄内容
    // db_tab = null; // 1(question), 2(PAD), 3(execute), 4(inactive)
    db_input = "null"; // 入力内容
    db_result = "null"; // 実行結果
    db_raw_code = "null"; // なまこ
}

// paiza api を使って生コードと標準入力から出力結果を表示
function paiza_api_create() {
    source = culcurated_raw_code;
    input_value = document.getElementById("std_input").value;
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
    db_input = input_value;
    db_result = $("#compiler_output").val();
    event_data_upload();

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

/*
■■■■■■■■■■■■■■■■■■■■
    問題読み込み
    現状ではサーバー上の独自形式ローカルファイルから取得
■■■■■■■■■■■■■■■■■■■■
*/
// .questionファイルから問題データを読み込み

function loadKadai() {
    kadai_filename = decodeURIComponent(location.search.split("=")[1]);
    str = "./saiyou_mondai/" + kadai_filename + ".question";
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

        MathJax.Hub.Config({
            tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}
          });
                
        MathJax.Hub.Typeset($(".pad-question")[0]);

        // ブロック読み込み
        s_start = text.indexOf("<block>") + 7;
        s_end = text.indexOf("</block>");
        var block_part = (text.slice(s_start, s_end));
        console.log(block_part);
        /* 改行コードの処理がややこしい */
        block_part = block_part.replace(/\r/g, '\\r');
        block_part = block_part.replace(/\n/g, '\\n');
        block_part = block_part.replace(/!!/g, '!!\n');
        console.log(block_part);
        /* ここで、コード断片毎に分割 */
        var s_blocks = block_part.split("!!\n");
        var s_block;
        var block_html;
        var id = 0;
        for (var i = 0; i < s_blocks.length - 1; i++) {
            /* 再度文字コードの処理 */
            console.log(s_block);
            s_block = s_blocks[i].replace(/^\\n/g, "").replace(/^\\r\\n/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split("$");
            s_block[1] = s_block[1].replace(/;(\s)*\\r\\n/g, ";<br>").replace(/;(\s)*\\n/g, ";<br>"); // 表示上、実際の改行をbrに
            s_block[1] = s_block[1].replace(/#(.*?)\\r\\n/g, "#$1<br>"); // 表示上、実際の改行をbrに

            /* 重複の確認 データ分析の関係上、各コード断片は独立でなければならないため、重複がないことを想定して作られている */
            obj = s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">');
            temp_i = id;
            var switch_flag = 1;
            $(".draggable").each(function(index, element){
                if(obj == element.innerText) {
                    console.log(obj + "は重複しています");
                    console.log(element);
                    temp_i = $(element).attr("id");
                    // console.log(temp_i);
                    switch_flag = 0;
                    return false;
                } else {
                    switch_flag = 1;
                }
            });
            // console.log(temp_i + ", " + obj);

            /* コード断片の種類によってHTMLを挿入 */
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
                case 'b_loop':
                    block_html = "<li class='draggable' id=" + i + " isoid=" + temp_i + "><div id='block-" + i + "' class='block-b_loop block'><p class='module-name'>" + s_block[1].replace(/\\空欄/g, '<input type="text" class="input-text">'); +"</p></div></li>";
                    break;
            }

            // テキストが更新されたら取得
            // なんでここに書いてあるんだろ
            $(document).on({
                'change': function () {
                    get_raw_code();
                }
            }, ".input-text");

            // ここで実際に左の枠に追加
            $(".pad-blockzone-in").children(".sortable").append(block_html);

            // 既存のブロックにポップアップを設定（もしあるなら）
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
}

// シャッフル
function shuffleContent(container) {
	var content = container.find("> *");
	var total = content.size();
	content.each(function() {
		content.eq(Math.floor(Math.random()*total)).prependTo(container);
	});
}

/* 未使用　機能的にもDebug画面に移行 */
function showInfo() {
    $("#stage-info").html("<h2>" + user + "さん</h2>");
    $("#stage-info").append("<p>問題文：" + tab1_time / 100 + "秒<br>" +
        "PAD：" + tab2_time / 100 + "秒<br>" +
        "実行：" + tab3_time / 100 + "秒<br>" +
        "非アクティブ：" + tab4_time / 100 + "秒</p>");
    $("#stage-info").append("<p>処理時間：" + Math.round(($.now() - start_time) / 1000 * 100)/100 + "秒</p>");
    $("#stage-info").append("<p>経過時間：" + Math.round((tab1_time + tab2_time + tab3_time + tab4_time)/100 * 100)/100 + "秒</p>");
}

/*
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    タブ視聴時間計測用関数
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
*/

var passageTab1;
var passageTab2;
var passageTab3;
var passageTab4;
function tab1_countStart() {
    if (passageTab1 == null) {
        db_tab = "question";
        event_data_upload();
        passageTab1 = setInterval(function () {
            tab1_time += 1;
        }, 10);
    } else {
        return false;
    }
}
function tab2_countStart() {
    if (passageTab2 == null) {
        db_tab = "drawing";
        event_data_upload();
        passageTab2 = setInterval(function () {
            tab2_time += 1;
        }, 10);
    } else {
        return false;
    }
}
function tab3_countStart() {
    if (passageTab3 == null) {
        db_tab = "execute";
        event_data_upload();
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

/* 画面切り替え時に作図画面で描画されている線を非表示にする */
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

/*
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    MAIN
    いろいろと設定
■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
*/

var num = 0;
$(function () {
    var hoverFlag = 0;
    // 新たなブロックを追加（デバック用・アップデートしてない・未使用）
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
        draw_branch_border();
    });

    /*
    ○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○
        タブ視聴時間計測設定
        タブ切り替え設定
    ○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○
    */
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
        draw_branch_border();
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


     /*
    ○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○
        画面非表示時の設定
    ○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○
    */   
    // 画面を閉じている時間を計測
    document.addEventListener('webkitvisibilitychange', function(){
        if ( document.webkitHidden ) {
            tab1_countStop();
            tab2_countStop();
            tab3_countStop();
            hidden_time = $.now();
        } else {
            tab1_countStop();
            tab2_countStop();
            tab3_countStop();
            tab4_time += ($.now() - hidden_time)/10;
            switch($(".tab_label").index($(".active"))) {
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
    }, false);

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
        // デバッグ用：ウィンドウ非アクティブ時の画面表示オフ
        // $(".popup-content").css({"display": "none"})
    });

    // ウィンドウからフォーカスが外れたら指定した関数を実行
    window.addEventListener('blur', function(){
        db_tab = "inactive";
        event_data_upload();
        tab1_countStop();
        tab2_countStop();
        tab3_countStop();
        // デバッグ用：ウィンドウ非アクティブ時の画面表示オフ
        // $(".popup-content").css({"display": "table"}); // 非アクティブ時画面表示しない
        if ($(".login-wrapper").hasClass("inactive")) {
            inactive_time = $.now();
        } else {
            inactive_time = null;
        }
    });

     /*
    ○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○
        その他いろいろ
    ○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○
    */   
    
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
        // $('#compiler_output').val("");
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

    // テキストエリアにフォーカスしているのか！？※もしかしたら使わないかも
    var inputAreaFocusing = 0
    var inputting = 0
    var input_start = 0
    var new_this = 0
    var input_element = 0
    $(document).on('focus, click', '.input-text', function (e) {
        // auto_size
        if( this.value.length != 0 ){
            $(this).attr('size', this.value.length * 0.9);
        } else {
            $(this).attr('size', 3);
        }
        redrawLine()
        draw_branch_border
        // sql送信
        db_event = "filling";
        db_block_id = $(this).closest("li").attr("id");
        db_block = $(this).closest("p").html().replace(/<input.*>/, this.value);
        db_blank = this.value;
        // console.log(db_event + ", " + db_block_id + ", " + db_block + "," + db_blank); // OK!
        event_data_upload();
        // 色付
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
        // auto_size
        if( this.value.length != 0 ){
            $(this).attr('size', this.value.length * 0.9);
        } else {
            $(this).attr('size', 3);
        }
        redrawLine()
        draw_branch_border
        // sql送信
        db_event = "filled";
        db_block_id = $(this).closest("li").attr("id");
        db_block = $(this).closest("p").html().replace(/<input.*>/, this.value);
        db_blank = this.value;
        // console.log(db_event + ", " + db_block_id + ", " + db_block + "," + db_blank); // OK!
        event_data_upload();

        new_this = this;
        inputting = 0;
        hoverFlag = 0;
        setTimeout(function () {
            $(new_this).css("background-color", "white")
            inputAreaFocusing = 0;
        }
            , 800)
    })

    // 指定秒数以上無操作ならフォーカスを切る。あと、バルーンを表示しない。
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
            user = $("#name").val().replace(/\s+/g, "");
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
                setTimeout(function(){
                    $(".input-text").attr("size", "3");
                    draw_branch_border();
                }, 40)
                setTimeout(function () {
                    start_time = $.now();
                    createArray();
                    createTable();
                    create_table_event();
                    myDraggable();
                    setTimeout(function () {
                        // デバッグ時はオフ
                        // shuffleContent($('#draggable1'));
                        tab1_countStart();
                    }, 50);
                }, 300);

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
