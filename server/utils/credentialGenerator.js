const bcrypt = require('bcryptjs');

const generateCredentials = async (user) => {
    // Build initials from all parts of the name (first + last)
    const nameParts = `${user.first_name.trim()} ${user.last_name.trim()}`.split(/\s+/);
    const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('');

    // Strip dashes (and any non-digit characters) from the ID
    const numericId = user.user_id.replace(/\D/g, '');

    const generatedUsername = `${initials}${numericId}`;

    const last4Id = user.role === 'Faculty' ? user.user_id.slice(-3) : user.user_id.slice(-4);
    const rawPassword = `${user.role.toLowerCase()}${last4Id}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    return { generatedUsername, passwordHash, rawPassword };
};

module.exports = { generateCredentials };