const bcrypt = require('bcryptjs');
module.exports = [
  { id: 1, name: 'Demo Student', email: 'student@campusconnect.test',
    passwordHash: bcrypt.hashSync('Campus26', 10) },
];
