const pool = require('../config/db');

const profileModel = {
  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM profiles WHERE username = ?', [username]);
    return rows[0] || null;
  },

  async insert(data) {
    const [result] = await pool.query('INSERT INTO profiles SET ?', [data]);
    return this.findById(result.insertId);
  },

  async update(username, data) {
    data.times_analyzed = pool.query('SELECT times_analyzed FROM profiles WHERE username = ?', [username]);
    await pool.query('UPDATE profiles SET ?, times_analyzed = times_analyzed + 1 WHERE username = ?', [data, username]);
    return this.findByUsername(username);
  },

  async findAll(limit, offset) {
    const [profiles] = await pool.query('SELECT * FROM profiles ORDER BY analyzed_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM profiles');
    return { profiles, total };
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM profiles WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async remove(username) {
    const [result] = await pool.query('DELETE FROM profiles WHERE username = ?', [username]);
    return result.affectedRows > 0;
  },
};

module.exports = profileModel;