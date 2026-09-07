import { JoinRequest } from '../models/JoinRequest.js';
import { Plan } from '../models/Plan.js';
import { Connection } from '../models/Connection.js';
import { Notification } from '../models/Notification.js';

export const createJoinRequest = async (req, res) => {
  try {
    const { planId, message } = req.body;
    const plan = await Plan.findById(planId);

    if (!plan || plan.status !== 'open') {
      return res.status(400).json({ success: false, error: 'Plan is closed or does not exist.' });
    }

    if (plan.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot join your own plan.' });
    }

    if (plan.joinedCount >= plan.maxPeople) {
      return res.status(400).json({ success: false, error: 'Plan is already full.' });
    }

    const existingReq = await JoinRequest.findOne({ plan: planId, requester: req.user._id });
    if (existingReq) {
      return res.status(400).json({ success: false, error: 'You already have an active request for this plan.' });
    }

    const joinRequest = await JoinRequest.create({
      plan: planId,
      requester: req.user._id,
      creator: plan.creator,
      message,
    });

    await Notification.create({
      recipient: plan.creator,
      sender: req.user._id,
      type: 'join_request_received',
      title: 'New Join Request!',
      message: `${req.user.name} requested to join "${plan.title}"`,
      data: { planId, requestId: joinRequest._id },
    });

    res.status(201).json({ success: true, data: joinRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getIncomingRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ creator: req.user._id })
      .populate('requester', 'name avatar age location bio interests')
      .populate('plan', 'title category date time location')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMySentRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ requester: req.user._id })
      .populate({
        path: 'plan',
        populate: { path: 'creator', select: 'name avatar' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found.' });

    if (request.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to accept this request.' });
    }

    const plan = await Plan.findById(request.plan);
    if (!plan || plan.joinedCount >= plan.maxPeople) {
      return res.status(400).json({ success: false, error: 'Plan is full or no longer active.' });
    }

    request.status = 'accepted';
    await request.save();

    plan.joinedCount += 1;
    if (!plan.members.includes(request.requester)) {
      plan.members.push(request.requester);
    }
    if (plan.joinedCount >= plan.maxPeople) {
      plan.status = 'full';
    }
    await plan.save();

    // Create Connection
    let connection = await Connection.findOne({
      plan: plan._id,
      users: { $all: [req.user._id, request.requester] },
    });

    if (!connection) {
      connection = await Connection.create({
        users: [req.user._id, request.requester],
        plan: plan._id,
        status: 'active',
      });
    }

    await Notification.create({
      recipient: request.requester,
      sender: req.user._id,
      type: 'join_request_accepted',
      title: 'Join Request Accepted! 🎉',
      message: `${req.user.name} accepted your request to join "${plan.title}". Private chat is now unlocked!`,
      data: { planId: plan._id, connectionId: connection._id },
    });

    res.json({ success: true, data: { request, connectionId: connection._id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found.' });

    if (request.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized.' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
