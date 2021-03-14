<?php

/*
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
*/

$data = array();
$user = $_POST['user'];
$kadai = $_POST['kadai'];
$time_stamp = $_POST['time_stamp'];
$time_stamp = time();
$tab1_time = $_POST['tab1_time'];
$tab2_time = $_POST['tab2_time'];
$tab3_time = $_POST['tab3_time'];
$tab4_time = $_POST['tab4_time'];
$copy_num = $_POST['copy_num'];
$compile_num = $_POST['compile_num'];
$block_touch_num = $_POST['block_touch_num'];
$block_hover_time = $_POST['block_hover_time'];
$json = $_POST['json'];

$table_name = $_POST['table_name'];

$conn = mysqli_connect('www.osakanalab.work:3306', 'HirokiItoExp2020', 'HirokiItoExp2020');

// if (mysqli_connect_errno()) {
//   die("データベースに接続できません:" . mysqli_connect_error() . "\n");
// } else {
//   echo "データテーブルの作成に成功しました。\n";
// }


if(!$conn) {
  http_response_code(400);
  die('SQLさーばーへの接続しっぱいしたよぉ…');  
}


$db = mysqli_select_db($conn, 'exp2020');
if(!$conn) {
  http_response_code(400);
  die('データベースへの接続しっぱいしたよぉ…');
}

$column = "user char(255), time_stamp bigint, json text, tab1_time int, tab2_time int, tab3_time int, tab4_time int, copy_num int, compile_num int";
for($i = 0; $i<count($block_touch_num); $i++){
  $column .= ", block_touch_num_${i} int";
  $column .= ", block_hover_time_${i} int";
}
$sql = sprintf("CREATE TABLE exp2020.${table_name} ($column)");
#$sql = mb_convert_encoding($sql, "UTF-8", "auto");
$result_flag = mysqli_query($conn, $sql);
/*
$values = "'${user}', '${time_stamp}', '${tab1_time}', '${tab2_time}'";
for($i = 0; $i<count($block_touch_num); $i++){
  $column .= ", '$block_touch_num[$i]'";
  $column .= ", '$block_hover_time[$i]'";
}
$sql = sprintf("INSERT INTO ${table_name} (user, time_stamp, tab1_time, tab2_time, block_touch_num, block_hover_time) VALUES (${values}));
$result_flag = mysqli_query($conn, $sql);
*/
if (!$result_flag) {
    http_response_code(400);
    die('INSERTクエリーが失敗しました。'.mysqli_error($conn));
}

mysqli_close($conn);

header('Content-Type: application/json; charset=utf-8');
echo json_encode($data);

?>
