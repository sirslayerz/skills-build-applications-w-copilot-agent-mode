import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePositiveMinutes(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue;
    }
  }
  throw badRequest('Minutes must be a positive number');
}

function normalizeObjectId(value: unknown, field: string) {
  const id = typeof value === 'string' ? value : value instanceof mongoose.Types.ObjectId ? value.toString() : '';
  if (!mongoose.isValidObjectId(id)) {
    throw badRequest(`${field} must be a valid ObjectId`);
  }
  return new mongoose.Types.ObjectId(id);
}

function normalizeMemberIds(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw badRequest('Members must be an array of ObjectIds');
  }
  return value.map((member) => normalizeObjectId(member, 'Member'));
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw badRequest('Activity payload is required');
  }

  const userId = normalizeObjectId(input.userId, 'userId');
  const teamId = normalizeObjectId(input.teamId, 'teamId');
  const type = typeof input.type === 'string' && input.type.trim() ? input.type.trim() : '';
  const minutes = normalizePositiveMinutes(input.minutes);

  if (!type) {
    throw badRequest('Activity type is required');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw notFound('User not found');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw notFound('Team not found');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw badRequest('Team payload is required');
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  if (!name) {
    throw badRequest('Team name is required');
  }
  if (!mascot) {
    throw badRequest('Team mascot is required');
  }

  const team = await Team.create({
    name,
    mascot,
    members: normalizeMemberIds(input.members),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return rows.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = typeof userEmail === 'string' ? userEmail.trim() : '';
  const user = await User.findOne({ email });

  if (!user) {
    throw notFound('User not found');
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focus = user.fitnessGoal || recentActivity?.type || 'endurance';
  const workouts = (await Workout.find({ focus }).sort({ minutes: 1 }).lean()).map((workout) => ({
    ...workout,
    reason: recentActivity
      ? `Based on your recent ${recentActivity.type} activity and ${focus} goal, this workout matches your pattern.`
      : `Based on your ${focus} goal, this workout matches your training plan.`,
  }));

  if (workouts.length === 0) {
    const fallback = await Workout.find().sort({ minutes: 1 }).lean();
    if (fallback.length === 0) {
      return [];
    }
    return fallback.map((workout) => ({
      ...workout,
      reason: `Based on your recent activity pattern and ${focus} goal, this workout is a good fit.`,
    }));
  }

  return workouts;
}

export { User };
