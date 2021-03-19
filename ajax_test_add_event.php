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
$db_event = $_POST['db_event'];
$db_block_id = $_POST['db_block_id'];
$db_block = $_POST['db_block'];
$db_blank = $_POST['db_blank'];
$db_tab = $_POST['db_tab'];
$db_input = $_POST['db_input'];
$db_result = $_POST['db_result'];
$db_raw_code = $_POST['db_raw_code'];


$table_name = $_POST['table_name'];

$conn = mysqli_connect('www.osakanalab.work:3306', 'HirokiItoExp2020', 'HirokiItoExp2020');

if(!$conn) {
  die('SQLさーばーへの接続しっぱいしたよぉ…');
}

$db = mysqli_select_db($conn, 'exp2020');
if(!$conn) {
  die('データベースへの接続しっぱいしたよぉ…');
}

$column = "user , kadai , time_stamp , db_raw_code , db_event, db_block_id , db_block , db_blank , db_tab , db_input , db_result ";
// for($i = 0; $i<count($block_touch_num); $i++){
//   $column .= ", block_touch_num_${i} ";
//   $column .= ", block_hover_time_${i} ";
// }

$values = "'${user}', '${kadai}', '${time_stamp}', '${db_raw_code}', '${db_event}', '${db_block_id}', '${db_block}', '${db_blank}', '${db_tab}', '${db_input}', '${db_result}'";
// foreach (array_map(null, $block_touch_num, $block_hover_time) as [$val1, $val2]) {
//   $values .= ", '${val1}'";
//   $values .= ", '${val2}'";
// }

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
