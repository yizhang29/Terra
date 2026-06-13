const Anthropic = require('@anthropic-ai/sdk');

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(stravaActivities, userProfile) {
  const { name, goal, weight_kg } = userProfile;

  // Weekly distance (last 7 days), meters → km
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyKm = stravaActivities
    .filter(a => new Date(a.start_date) >= sevenDaysAgo)
    .reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;

  // Average HR across last 3 runs
  const runs = stravaActivities.filter(a => a.type === 'Run');
  const last3Runs = runs.slice(0, 3);
  const runsWithHr = last3Runs.filter(a => a.average_heartrate);
  const avgHr = runsWithHr.length > 0
    ? runsWithHr.reduce((sum, a) => sum + a.average_heartrate, 0) / runsWithHr.length
    : null;

  const recoveryRisk = avgHr !== null && avgHr > 155;

  // Last 5 activities summary
  const recentActivities = stravaActivities.slice(0, 5).map(a => {
    const date = a.start_date ? a.start_date.split('T')[0] : 'unknown';
    const km = ((a.distance || 0) / 1000).toFixed(1);
    const hr = a.average_heartrate ? `${Math.round(a.average_heartrate)} bpm` : 'no HR';
    return `- ${date}: ${a.type}, ${km} km, ${hr}`;
  }).join('\n');

  return `You are Terra, a warm, knowledgeable, and evidence-based running coach. You give specific, actionable advice grounded in exercise science.

Athlete: ${name}
Goal: ${goal}${weight_kg ? `\nWeight: ${weight_kg} kg` : ''}

This week's distance: ${weeklyKm.toFixed(1)} km${recoveryRisk ? `\n\n⚠️ Recovery alert: average heart rate across the last 3 runs is ${Math.round(avgHr)} bpm, which is elevated. Recommend prioritising recovery today.` : ''}

Recent activities:
${recentActivities || 'No recent activities.'}

Give specific, actionable advice based on this data. Reference the athlete's recent training when relevant.`;
}

module.exports = { anthropicClient, buildSystemPrompt };
