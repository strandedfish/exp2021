<?php

$data = array();
$user = $_POST['user'];
$time_stamp = $_POST['time_stamp'];
$tab1_time = $_POST['tab1_time'];
$tab2_time = $_POST['tab2_time'];
$block_touch_num = $_POST['block_touch_num'];
$block_hover_time = $_POST['block_hover_time'];
$json = $_POST['json'];

$table_name = $_POST['table_name'];

$conn = mysqli_connect('localhost', 'exp2019', 'exp2019');
if(!$conn) {
  die('SQLさーばーへの接続しっぱいしたよぉ…');
}
$db = mysqli_select_db($conn, 'exp2019_October');
if(!$conn) {
  die('データベースへの接続しっぱいしたよぉ…');
}

$column = "user char(255), time_stamp bigint, json text, tab1_time int, tab2_time int";
for($i = 0; $i<count($block_touch_num); $i++){
  $column .= ", block_touch_num_${i} int";
  $column .= ", block_hover_time_${i} int";
}
$sql = sprintf("CREATE TABLE exp2019_October.${table_name} ($column)");
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
    die('INSERTクエリーが失敗しました。'.mysqli_error($conn));
}

mysqli_close($conn);

header('Content-Type: application/json; charset=utf-8');
echo json_encode($data);

?>
