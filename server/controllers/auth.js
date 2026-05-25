const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid username or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid username or password' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            _id: user._id,
            user_id: user.user_id,
            name: `${user.first_name} ${user.last_name}`,
            username: user.username,
            role: user.role,
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser };