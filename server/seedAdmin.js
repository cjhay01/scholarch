const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const { setServers } = require("node:dns/promises");

setServers(["1.1.1.1", "8.8.8.8"]);

// Load environment variables
dotenv.config({ quiet: true });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Check if an admin already exists to prevent duplicates
        const adminExists = await User.findOne({ role: 'Admin' });
        if (adminExists) {
            console.log('Admin account already exists.');
            process.exit(0);
        }

        // Hash the initial admin password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin1234', salt); // Change this to a secure password

        // Create the Admin
        const adminUser = await User.create({
            user_id: 'ADMIN-001',
            first_name: 'System',
            last_name: 'Administrator',
            email: 'admin@plv.edu.ph',
            password: passwordHash,
            role: 'Admin',
            department: 'Administration'
        });

        console.log('Root Admin created successfully:', adminUser.email);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();