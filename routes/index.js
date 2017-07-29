var express = require('express');
var router = express.Router();

//converting to cron job
/*
var main = require('../Main');
main.updateSQL();
*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Scala' });
  //main.updateSQL();
});

module.exports = router;
