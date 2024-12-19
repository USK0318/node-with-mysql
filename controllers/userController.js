const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');


// register user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userextist = 'SELECT * FROM users WHERE email = ?';
    const [result] = await db.query(userextist, [email])
    if (result.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    const app = db.query(query, [name, email, hashedPassword]);
    return res.status(201).json({ message: 'User registered successfully' });
  }
  catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';
    const [result] = await db.query(query, [email]);
    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const passwordIsValid = bcrypt.compareSync(password, result[0].password);
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ id: result[0].id }, process.env.JWT_SECRET, { expiresIn: '500h' });
    return res.status(200).json({ token });
  }
  catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// get user details
const getUserDetails = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedId = jwt.verify(token, process.env.JWT_SECRET).id;
    const query = 'SELECT id,name,email FROM users WHERE id = ?';
    const [result] = await db.query(query, [decodedId]);
    return res.status(200).json(result[0]);
  }
  catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { register, login, getUserDetails };
