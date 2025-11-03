const express = require('express');
const User = require('../models/User');
const StudentSkills = require('../models/StudentSkills');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, rollNumber, department, year } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: ' User already exists' });

        user = new User({
            name,
            email,
            password,
            role: role || 'student',
            rollNumber: role === 'student' ? rollNumber : undefined,
            department: role === 'student' ? department : undefined,
            year: role === 'student' ? year : undefined
        });

        await user.save();


        if (role === 'student') {
            const skills = new StudentSkills({ student: user._id });
            await skills.save();
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name,
                email,
                role: user.role,
                rollNumber: user.rollNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(400).json({ error: 'User not found' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;