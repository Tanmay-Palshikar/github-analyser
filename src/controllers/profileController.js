const { fetchProfileInsights } = require('../services/githubService');
const profileModel = require('../models/profileModel');

const respond = (res, status, message, data = null, meta = {}) =>
  res.status(status).json({ success: status < 400, message, data, meta });

exports.analyzeProfile = async (req, res) => {
  try {
    const { username } = req.params;

    if (!/^[a-zA-Z0-9-]{1,39}$/.test(username))
      return respond(res, 400, 'Invalid GitHub username format');

    const existing = await profileModel.findByUsername(username);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (existing && new Date(existing.analyzed_at) > oneHourAgo)
      return respond(res, 200, 'Served from cache', existing, { source: 'cache' });

    const insights = await fetchProfileInsights(username);

    const profile = existing
      ? await profileModel.update(username, insights)
      : await profileModel.insert(insights);

    respond(res, 200, 'Profile analyzed successfully', profile, { source: 'github' });
  } catch (err) {
    console.error(err);
    if (err.response?.status === 404)
      return respond(res, 404, 'GitHub user not found');
    respond(res, 500, 'Something went wrong', null);
  }
};

exports.getAllProfiles = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { profiles, total } = await profileModel.findAll(limit, offset);

    respond(res, 200, 'Profiles fetched', profiles, {
      page, limit, total, pages: Math.ceil(total / limit),
    });
  } catch {
    respond(res, 500, 'Something went wrong');
  }
};

exports.getSingleProfile = async (req, res) => {
  try {
    const profile = await profileModel.findByUsername(req.params.username);
    if (!profile) return respond(res, 404, 'Profile not found');
    respond(res, 200, 'Profile fetched', profile);
  } catch {
    respond(res, 500, 'Something went wrong');
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const deleted = await profileModel.remove(req.params.username);
    if (!deleted) return respond(res, 404, 'Profile not found');
    respond(res, 200, 'Profile deleted successfully');
  } catch {
    respond(res, 500, 'Something went wrong');
  }
};

exports.compareProfiles = async (req, res) => {
  try {
    const users = req.query.users?.split(',').map(u => u.trim());

    if (!users || users.length !== 2)
      return respond(res, 400, 'Provide exactly 2 usernames e.g. ?users=u1,u2');

    const profiles = await Promise.all(users.map(profileModel.findByUsername));

    if (profiles.some(p => !p))
      return respond(res, 404, 'One or both profiles not found. Analyze them first.');

    const [a, b] = profiles;
    const comparison = {
      usernames:               [a.username, b.username],
      profile_score:           [a.profile_score, b.profile_score],
      followers:               [a.followers, b.followers],
      public_repos:            [a.public_repos, b.public_repos],
      total_stars:             [a.total_stars, b.total_stars],
      top_languages:           [a.top_languages, b.top_languages],
      account_age_days:        [a.account_age_days, b.account_age_days],
      avg_stars_per_repo:      [a.avg_stars_per_repo, b.avg_stars_per_repo],
      winner: a.profile_score >= b.profile_score ? a.username : b.username,
    };

    respond(res, 200, 'Comparison ready', comparison);
  } catch {
    respond(res, 500, 'Something went wrong');
  }
};