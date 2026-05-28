
const axios = require('axios');
const GITHUB_API = 'https://api.github.com';
const headers = {
  Authorization: `token ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};
// converts ISO formatof dates 
const toMySQLDate = (isoString) => isoString ? isoString.replace('T', ' ').replace('Z', '') : null;
async function fetchProfileInsights(username) {
  // obtain user profile
  const { data: user } = await axios.get(`${GITHUB_API}/users/${username}`, { headers });
//obtain repos
  const { data: repos } = await axios.get(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=stars`,
    { headers }
  );

  // account age
  const createdAt = new Date(user.created_at);
  const ageDays = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

  // laguage freq
  const langMap = {};
  repos.forEach(r => {
    if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
  });
  const topLanguages = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  // repo info
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const avgStarsPerRepo = user.public_repos
    ? +(totalStars / user.public_repos).toFixed(2)
    : 0;

  const mostStarred = [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count
  )[0];

  // profile score 0to100 
  let score = 0;
  if (user.bio)             score += 10;
  if (user.avatar_url)      score += 5;
  if (user.location)        score += 5;
  if (user.blog)            score += 10;
  if (user.email)           score += 10;
  score += Math.min(user.public_repos * 2, 20);  
  score += Math.min(user.followers, 20);         
  if (topLanguages.length >= 3) score += 10;     
  if (user.hireable)        score += 10;

  return {
    username:                 user.login,
    name:                     user.name,
    bio:                      user.bio,
    avatar_url:               user.avatar_url,
    location:                 user.location,
    company:                  user.company,
    blog:                     user.blog,
    twitter_handle:           user.twitter_username,
    email:                    user.email,
    public_repos:             user.public_repos,
    public_gists:             user.public_gists,
    followers:                user.followers, 
    following:                user.following, 
    total_stars:              totalStars,          
    total_forks:              totalForks,         
    avg_stars_per_repo:       avgStarsPerRepo,     
    most_starred_repo:        mostStarred?.name || null,
    most_starred_repo_url:    mostStarred?.html_url || null, 
    most_starred_count:       mostStarred?.stargazers_count || 0,
    top_languages:            JSON.stringify(topLanguages),
    account_age_days:         ageDays,
    repos_per_year:           +(user.public_repos / (ageDays / 365)).toFixed(2),
    follower_following_ratio: user.following
                                ? +(user.followers / user.following).toFixed(4)
                                : user.followers,
    is_hireable:              !!user.hireable,
    profile_score:            Math.min(score, 100),
    github_created_at:        toMySQLDate(user.created_at),
    github_updated_at:        toMySQLDate(user.updated_at),
  };
}
module.exports = { fetchProfileInsights };