const User = require('../models/User');
const { generateCredentials } = require('../utils/credentialGenerator');
const streamifier = require('streamifier');
const csv = require('csv-parser');

// 1. Manual Account Creation (Admin creates Faculty, Faculty creates Student)
const createUser = async (req, res) => {
    const { user_id, first_name, last_name, target_role } = req.body;

    // Validation: Admins create Faculty; Faculty creates Students
    if (req.user.role === 'Admin' && target_role !== 'Faculty') {
        return res.status(400).json({ message: 'Admins can only create Faculty accounts.' });
    }
    if (req.user.role === 'Faculty' && target_role !== 'Student') {
        return res.status(400).json({ message: 'Faculty can only create Student accounts.' });
    }

    try {
        const userExists = await User.findOne({ user_id });
        if (userExists) return res.status(400).json({ message: 'User ID already exists' });

        const newUser = await User.create({
            user_id,
            first_name,
            last_name,
            role: target_role,
            adviser_id: target_role === 'Student' ? req.user._id : undefined,
            creator_id: req.user._id
        });

        res.status(201).json({ message: 'User created successfully without credentials', user: newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Batch Upload (Faculty uploads Student CSV)
const batchCreateStudents = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload a CSV file' });

    const students = [];
    const errors = [];

    streamifier.createReadStream(req.file.buffer)
        .pipe(csv())
        .on('data', (row) => {
            // Expected CSV headers: user_id, first_name, last_name
            if (row.user_id && row.first_name && row.last_name) {
                students.push({
                    user_id: row.user_id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    role: 'Student',
                    adviser_id: req.user._id, // Assign to the uploading faculty
                    creator_id: req.user._id
                });
            }
        })
        .on('end', async () => {
            try {
                const result = await User.insertMany(students, { ordered: false });
                res.status(201).json({ message: `${result.length} students batched successfully.`, result });
            } catch (error) {
                // Handle duplicate key errors gracefully
                if (error.code === 11000) {
                    res.status(207).json({ message: 'Batch completed with some duplicate user_id errors.', error: error.writeErrors });
                } else {
                    res.status(500).json({ message: error.message });
                }
            }
        });
};

// 3. Auto-Generate Credentials
const generateUserCredentials = async (req, res) => {
    const { id } = req.params; // Target user's Object ID

    try {
        const targetUser = await User.findById(id);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });
        if (targetUser.email) return res.status(400).json({ message: 'Credentials already generated for this user' });

        // Authorization checks
        if (req.user.role === 'Faculty' && targetUser.role !== 'Student') {
            return res.status(403).json({ message: 'Faculty can only generate credentials for Students' });
        }
        if (req.user.role === 'Admin' && targetUser.role !== 'Faculty') {
            return res.status(403).json({ message: 'Admin can only generate credentials for Faculty' });
        }

        const { generatedEmail, passwordHash, rawPassword } = await generateCredentials(targetUser);

        targetUser.email = generatedEmail;
        targetUser.password = passwordHash;
        await targetUser.save();

        // In a production app, do NOT send the raw password back. 
        // You would use NodeMailer here to send an email to a secondary address or display it ONCE to the creator.
        res.status(200).json({
            message: 'Credentials generated successfully',
            email: targetUser.email,
            temporaryPassword: rawPassword
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3b. Get users without credentials (pending)
const getPendingUsers = async (req, res) => {
    try {
        let query = { email: { $exists: false } };

        // Faculty sees only their own students; Admin sees only Faculty
        if (req.user.role === 'Faculty') {
            query.role = 'Student';
            query.adviser_id = req.user._id;
        } else if (req.user.role === 'Admin') {
            query.role = 'Faculty';
        }

        const users = await User.find(query)
            .select('user_id first_name last_name role createdAt')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3c. Generate credentials for ALL pending users
const generateAllCredentials = async (req, res) => {
    try {
        let query = { email: { $exists: false } };

        if (req.user.role === 'Faculty') {
            query.role = 'Student';
            query.adviser_id = req.user._id;
        } else if (req.user.role === 'Admin') {
            query.role = 'Faculty';
        }

        const pendingUsers = await User.find(query);
        if (pendingUsers.length === 0) {
            return res.status(400).json({ message: 'No pending users to generate credentials for.' });
        }

        const results = [];
        for (const targetUser of pendingUsers) {
            const { generatedEmail, passwordHash, rawPassword } = await generateCredentials(targetUser);
            targetUser.email = generatedEmail;
            targetUser.password = passwordHash;
            await targetUser.save();
            results.push({
                _id: targetUser._id,
                user_id: targetUser.user_id,
                name: `${targetUser.first_name} ${targetUser.last_name}`,
                email: generatedEmail,
                temporaryPassword: rawPassword
            });
        }

        res.status(200).json({ message: `Credentials generated for ${results.length} user(s).`, results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const bcrypt = require('bcryptjs');

// Edit basic profile info
const updateProfile = async (req, res) => {
    const { first_name, last_name, bio } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.first_name = first_name || user.first_name;
        user.last_name = last_name || user.last_name;
        user.bio = bio !== undefined ? bio : user.bio; // Allows clearing the bio

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            bio: updatedUser.bio
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Change password with old password confirmation
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        // Hash and set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// List users by role (for dropdowns)
const listUsersByRole = async (req, res) => {
    const { role } = req.query;
    const allowedRoles = ['Student', 'Faculty', 'Admin'];

    if (!role || !allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Valid role query parameter is required (Student, Faculty, Admin)' });
    }

    try {
        const users = await User.find({ role })
            .select('_id user_id first_name last_name')
            .sort({ last_name: 1, first_name: 1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get the logged-in student's adviser
const getMyAdviser = async (req, res) => {
    try {
        const student = await User.findById(req.user._id);
        if (!student || !student.adviser_id) {
            return res.status(404).json({ message: 'No adviser assigned' });
        }

        const adviser = await User.findById(student.adviser_id)
            .select('_id user_id first_name last_name');

        if (!adviser) return res.status(404).json({ message: 'Adviser not found' });

        res.json(adviser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get classmates (students under the same adviser)
const getMyClassmates = async (req, res) => {
    try {
        const student = await User.findById(req.user._id);
        if (!student || !student.adviser_id) {
            return res.status(404).json({ message: 'No adviser assigned' });
        }

        const classmates = await User.find({
            _id: { $ne: req.user._id },
            adviser_id: student.adviser_id,
            role: 'Student'
        })
            .select('_id user_id first_name last_name')
            .sort({ last_name: 1, first_name: 1 });

        res.json(classmates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users created by the logged-in user
const getMyCreatedUsers = async (req, res) => {
    try {
        const users = await User.find({
            $or: [
                { creator_id: req.user._id },
                { adviser_id: req.user._id }
            ]
        })
        .select('user_id first_name last_name email role createdAt')
        .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUser,
    batchCreateStudents,
    generateUserCredentials,
    getPendingUsers,
    generateAllCredentials,
    listUsersByRole,
    getMyAdviser,
    getMyClassmates,
    getMyCreatedUsers,
    updateProfile,
    changePassword
};