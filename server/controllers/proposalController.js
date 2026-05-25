const Proposal = require('../models/Proposal');

// Create a new proposal
const createProposal = async (req, res) => {
    const { title, members, adviser, abstract } = req.body;

    try {
        // Parse JSON strings if sent via FormData
        const parsedMembers = typeof members === 'string' ? JSON.parse(members) : members;

        // Ensure the creator is always included as a member
        const memberIds = Array.isArray(parsedMembers) ? [...parsedMembers] : [];
        const creatorId = req.user._id.toString();
        if (!memberIds.includes(creatorId)) {
            memberIds.push(creatorId);
        }

        const proposalData = {
            title,
            members: memberIds,
            adviser: adviser || req.user.adviser_id,
            abstract,
            submissionDate: Date.now()
        };

        if (req.file) {
            proposalData.file = req.file.filename;
        }

        const proposal = await Proposal.create(proposalData);
        res.status(201).json(proposal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Edit proposal info
const updateProposal = async (req, res) => {
    const { id } = req.params;
    const { title, abstract, objectives, methodology, members, adviser, submissionDate, approvalDate } = req.body;

    try {
        const proposal = await Proposal.findById(id);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        // Optional: Add authorization check so only assigned members, adviser, or admin can edit
        const isMember = proposal.members.includes(req.user._id);
        const isAdviser = proposal.adviser.equals(req.user._id);
        if (!isMember && !isAdviser && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to edit this proposal' });
        }

        // Prevent edits if status is beyond "Needs Revision" or "Submitted", unless Admin
        if (req.user.role !== 'Admin' && (proposal.status === 'Approved' || proposal.status === 'Completed')) {
            return res.status(400).json({ message: 'Cannot edit an approved or completed proposal' });
        }

        proposal.title = title || proposal.title;
        proposal.abstract = abstract || proposal.abstract;
        if (objectives) proposal.objectives = typeof objectives === 'string' ? JSON.parse(objectives) : objectives;
        if (methodology) proposal.methodology = typeof methodology === 'string' ? JSON.parse(methodology) : methodology;
        if (members) proposal.members = typeof members === 'string' ? JSON.parse(members) : members;
        if (adviser) proposal.adviser = adviser;
        if (submissionDate) proposal.submissionDate = submissionDate;
        if (approvalDate) proposal.approvalDate = approvalDate;
        if (req.file) proposal.file = req.file.filename;

        const updatedProposal = await proposal.save();
        res.json(updatedProposal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 1. Get all proposals (with Role-Based Filtering)
const getProposals = async (req, res) => {
    try {
        let query = {};

        // Students only see proposals where they are a member
        if (req.user.role === 'Student') {
            query.members = req.user._id;
        }
        // Faculty see proposals where they are the adviser, OR proposals submitted for general review
        else if (req.user.role === 'Faculty') {
            query.adviser = req.user._id;
        }
        // Admins see everything (empty query)

        // Optional status filter via query params (e.g., /api/proposals?status=Submitted)
        if (req.query.status) {
            query.status = req.query.status;
        }

        const proposals = await Proposal.find(query)
            .populate('members', 'first_name last_name user_id')
            .populate('adviser', 'first_name last_name')
            .populate('feedback.reviewer', 'first_name last_name role')
            .sort({ submissionDate: -1 });

        res.json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Get a single proposal by ID
const getProposalById = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id)
            .populate('members', 'first_name last_name user_id')
            .populate('adviser', 'first_name last_name')
            .populate('feedback.reviewer', 'first_name last_name role');

        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        // Authorization check
        const isMember = proposal.members.some(member => member._id.equals(req.user._id));
        const isAdviser = proposal.adviser._id.equals(req.user._id);

        if (!isMember && !isAdviser && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to view this proposal' });
        }

        res.json(proposal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Change Proposal Status (e.g., Adviser approves or rejects)
const updateProposalStatus = async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['Submitted', 'To Be Reviewed', 'Needs Revision', 'Approved', 'Rejected', 'Completed'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const proposal = await Proposal.findById(req.params.id);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        // Only Adviser or Admin can change the status
        if (!proposal.adviser.equals(req.user._id) && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only the assigned adviser or admin can change the status' });
        }

        proposal.status = status;

        // Auto-set dates based on status
        if (status === 'Approved') proposal.approvalDate = Date.now();
        if (status === 'Completed') proposal.archiveDate = Date.now();

        const updatedProposal = await proposal.save();
        res.json(updatedProposal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Add Feedback / Comments (Faculty workflow)
const addFeedback = async (req, res) => {
    const { comment } = req.body;

    if (!comment) return res.status(400).json({ message: 'Comment text is required' });

    try {
        const proposal = await Proposal.findById(req.params.id);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        // Ensure only Faculty or Admin can leave official feedback
        if (req.user.role === 'Student') {
            return res.status(403).json({ message: 'Students cannot leave official review feedback' });
        }

        const newFeedback = {
            reviewer: req.user._id,
            comment: comment
        };

        proposal.feedback.push(newFeedback);

        // Optional: automatically change status to 'Needs Revision' if feedback is added
        if (req.body.needsRevision) {
            proposal.status = 'Needs Revision';
        }

        await proposal.save();
        res.status(201).json(proposal.feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Search Public / Archived Proposals (Utilizing the Text Index)
const searchArchives = async (req, res) => {
    const { keyword } = req.query;

    try {
        // Only search Completed or Approved projects for the archive
        let query = { status: { $in: ['Approved', 'Completed'] } };

        if (keyword) {
            query.$text = { $search: keyword };
        }

        const archives = await Proposal.find(query)
            .populate('members', 'first_name last_name')
            .populate('adviser', 'first_name last_name')
            // If searching by text, sort by relevance score
            .sort(keyword ? { score: { $meta: 'textScore' } } : { archiveDate: -1 });

        res.json(archives);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get public proposals (Approved and Completed)
const getPublicProposals = async (req, res) => {
    try {
        const proposals = await Proposal.find({ status: { $in: ['Approved', 'Completed'] } })
            .populate('members', 'first_name last_name user_id')
            .populate('adviser', 'first_name last_name')
            .sort({ submissionDate: -1 });
        res.json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single public proposal by ID
const getPublicProposalById = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id)
            .populate('members', 'first_name last_name user_id')
            .populate('adviser', 'first_name last_name');

        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        if (proposal.status !== 'Approved' && proposal.status !== 'Completed') {
            return res.status(403).json({ message: 'This proposal is not public' });
        }

        res.json(proposal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findByIdAndDelete(req.params.id);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this proposal' });
        }

        await proposal.deleteOne();
        res.json({ message: 'Proposal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProposal,
    updateProposal,
    getProposals,
    getProposalById,
    updateProposalStatus,
    addFeedback,
    searchArchives,
    getPublicProposals,
    getPublicProposalById,
    deleteProposal
};