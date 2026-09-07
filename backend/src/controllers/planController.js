import { Plan } from '../models/Plan.js';
import { JoinRequest } from '../models/JoinRequest.js';

export const getPlans = async (req, res) => {
  try {
    const { search, category, location, date, status = 'open' } = req.query;
    const query = {};

    if (status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (date) {
      query.date = date;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const plans = await Plan.find(query)
      .populate('creator', 'name avatar age location bio')
      .populate('members', 'name avatar')
      .sort({ date: 1 });

    const formattedPlans = plans.map((p) => ({
      id: p._id,
      title: p.title,
      category: p.category,
      date: p.date,
      time: p.time,
      location: p.location,
      maxPeople: p.maxPeople,
      joinedCount: p.joinedCount,
      remainingSlots: Math.max(0, p.maxPeople - p.joinedCount),
      budget: p.budget,
      description: p.description,
      travelPreference: p.travelPreference,
      image: p.image,
      creatorId: p.creator ? p.creator._id : null,
      creator: p.creator,
      status: p.status,
      createdAt: p.createdAt,
    }));

    res.json({ success: true, data: formattedPlans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id)
      .populate('creator', 'name avatar age location bio socialLinks')
      .populate('members', 'name avatar age');

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    res.json({
      success: true,
      data: {
        id: plan._id,
        title: plan.title,
        category: plan.category,
        date: plan.date,
        time: plan.time,
        location: plan.location,
        maxPeople: plan.maxPeople,
        joinedCount: plan.joinedCount,
        remainingSlots: Math.max(0, plan.maxPeople - plan.joinedCount),
        budget: plan.budget,
        description: plan.description,
        travelPreference: plan.travelPreference,
        image: plan.image,
        creatorId: plan.creator._id,
        creator: plan.creator,
        members: plan.members,
        status: plan.status,
        createdAt: plan.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { title, category, date, time, location, maxPeople, budget, description, travelPreference, image } = req.body;

    const plan = await Plan.create({
      title,
      category,
      date,
      time,
      location,
      maxPeople: parseInt(maxPeople, 10),
      joinedCount: 1,
      budget,
      description,
      travelPreference,
      image,
      creator: req.user._id,
      members: [req.user._id],
      status: 'open',
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    if (plan.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this plan' });
    }

    Object.assign(plan, req.body);
    await plan.save();

    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    if (plan.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this plan' });
    }

    plan.status = 'cancelled';
    await plan.save();

    res.json({ success: true, message: 'Plan cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyCreatedPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ creator: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyJoinedPlans = async (req, res) => {
  try {
    const plans = await Plan.find({
      members: req.user._id,
      creator: { $ne: req.user._id },
    }).populate('creator', 'name avatar');
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
