const bcrypt = require('bcryptjs');

const generateCredentials = async (user) => {
    const cleanFirstName = user.first_name.trim().toLowerCase();
    const cleanLastName = user.last_name.trim().toLowerCase();
    const generatedEmail = `${cleanFirstName}.${cleanLastName}@plv.edu.ph`;

    const last4Id = user.user_id.slice(-4);
    const rawPassword = `${user.role.toLowerCase()}${last4Id}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    return { generatedEmail, passwordHash, rawPassword };
};

module.exports = { generateCredentials };