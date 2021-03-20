const express = require('express');
const authMiddleware = require('../middlewares/Auth')
const router = express.Router();

const Project = require('../models/Project');
const Task = require('../models/Task');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().populate('user');

        return res.send({ projects });
    } catch (err) {
        return res.status(400).send({ error: 'Error loading projects' });
    }
});

router.get('/:projectId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate('user');

        return res.send({ project });
    } catch (err) {
        return res.status(400).send({ error: 'Error loading project' });
    }
});

router.post('/', async (req, res) => {
    // const { title, description } = req.body;
    try {
        const { title, description, tasks } = req.body;
        
        const project = await Project.create({ title, description, user: req.userId });

        tasks.map(Task => {

            
        })

        return res.send({ project });
    } catch (err) {
        return res.status(400).send({ error: 'Error creating new project' });
    }
});

router.put('/:projectId', async (req, res) => {
    res.send({ user: req.userId });
});

router.delete('/:projectId', async (req, res) => {
    try {
        await Project.findByIdAndRemove(req.params.projectId).populate('user');

        return res.send({ msg: 'removido' });
    } catch (err) {
        return res.status(400).send({ error: 'Error deleting project' });
    }
});


module.exports = app => app.use('/Projects', router);