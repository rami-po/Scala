/**
 * Created by Rami Khadder on 8/14/2017.
 */
exports.getMonday = function(callback) {
  const date = new Date();
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() - 1);
  }
  callback(date);
};

exports.convertDate = function(date, callback) {
  const mm = date.getMonth() + 1; // getMonth() is zero-based
  const dd = date.getDate();

  callback([date.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
  ].join('-'));

};
