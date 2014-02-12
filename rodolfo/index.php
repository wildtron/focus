<?php

define('SALT', '59ba258bb47205f01752ea6115a1d999');

/**
    $_POST['username'] should be a md5 hashed then md5 hashed with salt username
        md5(md5(username) . SALT)

    $_POST['password'] should be a md5 hashed password
        md5(password . SALT)

    $_POST['student_number'] should be a md5 hashed then md5 hashed with salt username
        md5(md5(student_number) . SALT)
        
    $_POST['access_token'] should be cd5dc408443efd58d059eb336e904005
*/

if (!isset($_POST['username']) ||
    !isset($_POST['password'])  ||
    !isset($_POST['student_number'])  ||
    !isset($_POST['access_token']) ||
    
    strlen($_POST['username']) !== 32 ||
    strlen($_POST['password']) !== 32 ||
    strlen($_POST['student_number']) !== 32 ||
    strlen($_POST['access_token']) !== 32 ||
    
    $_POST['access_token'] !== 'cd5dc408443efd58d059eb336e904005')
    
    exit(json_encode(array('message' => 'Invalid access :P')));
    
$link = new mysqli('localhost', 'systemone', 'r3dl34F', 'systemonev3');

$POST = array();
$POST['username'] = htmlspecialchars(trim($_POST['username']), ENT_QUOTES);
$POST['password'] = htmlspecialchars(trim($_POST['password']), ENT_QUOTES);
$POST['student_number'] = htmlspecialchars(trim($_POST['student_number']), ENT_QUOTES);

$query = 'select studentId from __users where
    md5(CONCAT(md5(id), "' . SALT . '")) = "' . $POST['username'] . '" AND
    md5(CONCAT(password, "' . SALT . '")) = "' . $POST['password'] . '" AND
    md5(CONCAT(md5(studentId), "' . SALT . '")) = "' . $POST['student_number'] . '" limit 1;';
    
$res = $link->query($query);

if ($res->num_rows < 1)
    exit(json_encode(array('message' => 'Username or password is wrong')));

$data = array();
while($row = $res->fetch_assoc())
    $data[] = $row;

$student_number = $data[0]['studentId'];
$link->close();


/**  ------------------------------------------------   **/
$link = new mysqli('localhost', 'systemone', 'r3dl34F', 'systemonev3');

$ret = array();

$res = $link->query('CALL GET_PS_FORM("' . $student_number . '")');
$data = array();
while($row = $res->fetch_assoc())
    $data[] = $row;

$ret['classes'] = $data;
$link->close();


$link = new mysqli('localhost', 'systemone', 'r3dl34F', 'systemonev3');
    
$res = $link->query('SELECT firstName, middleName, lastName from student where studentNumber = "' . $student_number . '";');
$data = array();
while($row = $res->fetch_assoc())
    $data[] = $row;

$ret['first_name'] = $data[0]['firstName'];
$ret['middle_name'] = $data[0]['middleName'];
$ret['last_name'] = $data[0]['lastName'];

$link->close();

exit(json_encode($ret));

