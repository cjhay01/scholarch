const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    adviser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submissionDate: { type: Date },
    abstract: { type: String, required: true },
    objectives: [{ type: String, required: true }],
    methodology: [{ type: String, required: true }],
    status: {
        type: String,
        enum: ['Submitted', 'To Be Reviewed', 'Needs Revision', 'Approved', 'Rejected', 'Completed'],
        default: 'Submitted'
    },
    feedback: [{
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    approvalDate: { type: Date },
    archiveDate: { type: Date },
    file: { type: String }
}, { timestamps: true });

ProposalSchema.index({ title: 'text', 'chapter_1.background': 'text' });

module.exports = mongoose.model('Proposal', ProposalSchema);