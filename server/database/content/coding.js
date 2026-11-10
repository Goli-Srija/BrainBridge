// Coding question bank = easy + medium + hard files.
const list = [
  ...require('./coding_easy'),
  ...(require('fs').existsSync(__dirname + '/coding_medium.js') ? require('./coding_medium') : []),
  ...(require('fs').existsSync(__dirname + '/coding_hard.js') ? require('./coding_hard') : []),
];
module.exports = list;
