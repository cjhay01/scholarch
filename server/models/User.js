const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true
    },
    password: { type: String },
    contact_number: { type: String },
    bio: { type: String },
    role: {
        type: String,
        enum: ['Student', 'Faculty', 'Admin'],
        required: true
    },
    department: { type: String, default: 'BSIT' },
    adviser_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    proposals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);