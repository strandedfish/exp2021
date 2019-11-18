<?php

$data = array();
$user = $_POST['user'];
$time_stamp = $_POST['time_stamp'];
$time_stamp = time();
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

$column = "user , time_stamp , json , tab1_time , tab2_time ";
for($i = 0; $i<count($block_touch_num); $i++){
  $column .= ", block_touch_num_${i} ";
  $column .= ", block_hover_time_${i} ";
}
$values = "'${user}', '${time_stamp}', '${json}', '${tab1_time}', '${tab2_time}'";
foreach (array_map(null, $block_touch_num, $block_hover_time) as [$val1, $val2]) {
  $values .= ", '${val1}'";
  $values .= ", '${val2}'";
}

$sql = "INSERT INTO ${table_name} (${column}) VALUES (${values})";
# $sql = mb_convert_encoding($sql, "UTF-8", "auto");
$result_flag = mysqli_query($conn, $sql);

if (!$result_flag) {
    die('INSERTクエリーが失敗しました。'.mysqli_error($conn));
}

mysqli_close($conn);

header('Content-Type: application/json; charset=utf-8');
echo json_encode($data);

?>
