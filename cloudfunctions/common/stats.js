const { db } = require('./db');
const { buildStats, normalizePrediction } = require('./home');

async function recalculatePredictionStats() {
  const predictionResult = await db.collection('prediction_archives')
    .where({
      status: 'PUBLISHED',
      isPublic: true,
    })
    .limit(1000)
    .get();

  const predictions = (predictionResult.data || []).map((item) => normalizePrediction(item));
  const stats = buildStats(predictions);
  const now = new Date();
  const payload = {
    key: 'global',
    ...stats,
    updatedAt: now,
  };
  const existing = await db.collection('prediction_stats').where({ key: 'global' }).limit(1).get();

  if (existing.data[0]) {
    await db.collection('prediction_stats').doc(existing.data[0]._id).update({
      data: payload,
    });
    return {
      ...payload,
      id: existing.data[0]._id,
    };
  }

  const created = await db.collection('prediction_stats').add({
    data: {
      ...payload,
      createdAt: now,
    },
  });

  return {
    ...payload,
    id: created._id,
  };
}

module.exports = {
  recalculatePredictionStats,
};
