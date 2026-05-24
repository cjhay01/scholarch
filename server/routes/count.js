const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const Proposal = require('../models/Proposal.js');
const User = require('../models/User.js');

router.get('/userCount', protect, restrictTo('Admin'), async (req, res) => {
    try {
        const current = await User.countDocuments();
        
        // Mocking previous month's count for the trend indicator
        const previous = Math.floor(current * 0.85); 

        res.json({ current, previous });
    } catch (err) {
        console.error('Error fetching user count:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/studyCount', protect, restrictTo('Admin'), async (req, res) => {
    try {
        const current = await Proposal.countDocuments({
            status: { $in: ['Approved', 'Completed'] }
        });

        // Mocking previous month's count for the trend indicator
        const previous = Math.floor(current * 0.9);

        res.json({ current, previous });
    } catch (err) {
        console.error('Error fetching study count:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/userGrowth', protect, restrictTo('Admin'), async (req, res) => {
    try {
        // Mocked growth data for the dashboard charts
        res.json([
            { month: 'Jan', newUsers: 5 },
            { month: 'Feb', newUsers: 8 },
            { month: 'Mar', newUsers: 12 },
            { month: 'Apr', newUsers: 9 },
            { month: 'May', newUsers: 15 },
            { month: 'Jun', newUsers: 18 }
        ]);
    } catch (err) {
        console.error('Error fetching user growth:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
