const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    password: { type: String },
    email: { type: String },
    contact_number: { type: String },
    bio: { type: String },
    role: {
        type: String,
        enum: ['Student', 'Faculty', 'Admin'],
        required: true
    },
    department: { type: String, default: 'BSIT' },
    year_and_section: { type: String },
    adviser_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    proposals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' }]
}, { timestamps: true });

// Add virtual 'name' and 'contact' fields so every JSON response
// includes the shape the frontend expects.
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (_doc, ret) {
        ret.name = `${ret.first_name} ${ret.last_name}`;
        ret.contact = ret.contact_number || '';
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);