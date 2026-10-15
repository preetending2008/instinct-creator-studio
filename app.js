"use strict";

const STORAGE_KEY = "instinct-studio-v1";
const initialData = {
  profile: { name: "", niche: "", audience: "", region: "", pillars: [], tone: "Warm and conversational" },
  trends: [],
  reels: [],
  ideas: []
};

const pageContent = document.getElementById("page-content");
const toastElement = document.getElementById("toast");
let data = loadData();
let activePage = "overview";
let toastTimer;
let ideaTrendId = "";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialData);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.profile || !Array.isArray(parsed.trends) || !Array.isArray(parsed.reels)) {
      throw new Error("The saved workspace data has an unexpected format.");
    }
    return {
      profile: { ...initialData.profile, ...parsed.profile },
      trends: parsed.trends,
      reels: parsed.reels,
      ideas: Array.isArray(parsed.ideas)
        ? parsed.ideas.map((idea) => ({ status: "Idea", plannedAt: "", ...idea }))
        : []
    };
  } catch (error) {
    showToast(`Could not load saved data: ${error.message}. A fresh workspace is open.`, true);
    return structuredClone(initialData);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    showToast(`Could not save your changes in this browser: ${error.message}`, true);
    return false;
  }
}

function showToast(message, isError = false) {
  toastElement.textContent = message;
  toastElement.classList.toggle("error", isError);
  toastElement.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastElement.classList.remove("visible"), 3200);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function setHeader() {
  const readableDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date());
  document.getElementById("today-label").textContent = readableDate;
  document.getElementById("avatar-initial").textContent = (data.profile.name.trim()[0] || "Y").toUpperCase();
  document.getElementById("trend-count").textContent = String(data.trends.length);
  document.getElementById("breadcrumb-current").textContent = ({
    overview: "Overview", trends: "Trend radar", ideas: "Reel studio",
    comments: "Comment drafts", analytics: "Analytics", profile: "My creator profile", help: "User manual"
  })[activePage];
  document.querySelectorAll(".nav-item[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === activePage);
  });
}

function navigate(page) {
  activePage = page;
  setHeader();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  const pages = {
    overview: renderOverview,
    trends: renderTrends,
    ideas: renderIdeas,
    comments: renderComments,
    analytics: renderAnalytics,
    profile: renderProfile,
    help: renderHelp
  };
  pageContent.innerHTML = pages[activePage]();
  bindPageEvents();
}

function heading(eyebrow, title, subtitle, action = "") {
  return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`;
}

function emptyState(symbol, title, copy, buttonLabel, page) {
  return `<div class="empty-state"><span class="empty-symbol">${symbol}</span><strong>${title}</strong><p>${copy}</p><button class="button button-secondary button-small" data-page="${page}">${buttonLabel}</button></div>`;
}

function trendPill(status) {
  const safeStatus = ["Rising", "Exploring", "Testing", "Watching"].includes(status) ? status : "Watching";
  return `<span class="trend-pill ${safeStatus.toLowerCase()}">${safeStatus}</span>`;
}

function plannerStatusPill(status) {
  const statuses = ["Idea", "Scripting", "Ready", "Scheduled", "Published"];
  const safeStatus = statuses.includes(status) ? status : "Idea";
  return `<span class="status-pill planner-${safeStatus.toLowerCase()}">${safeStatus}</span>`;
}

function trendSort(a, b) {
  const stages = { Rising: 0, Exploring: 1, Testing: 2, Watching: 3 };
  return (stages[a.status] ?? 4) - (stages[b.status] ?? 4) || (b.createdAt || "").localeCompare(a.createdAt || "");
}

function renderOverview() {
  const reels = data.reels;
  const recent = [...data.trends].sort(trendSort).slice(0, 4);
  const nextIdea = [...data.ideas]
    .filter((idea) => idea.plannedAt && idea.status !== "Published")
    .sort((a, b) => a.plannedAt.localeCompare(b.plannedAt))[0];
  const averageEngagement = reels.length
    ? reels.reduce((total, reel) => total + reel.engagement, 0) / reels.length
    : 0;
  const totalReach = reels.reduce((total, reel) => total + reel.reach, 0);
  const totalSavesShares = reels.reduce((total, reel) => total + reel.saves + reel.shares, 0);
  const profileReady = Boolean(data.profile.niche.trim());
  const trendContent = recent.length
    ? `<div class="trend-list">${recent.map((trend, index) => `<div class="trend-row"><span class="trend-rank">${String(index + 1).padStart(2, "0")}</span><div class="trend-row-copy"><div class="trend-name">${escapeHtml(trend.topic)}</div><div class="trend-meta">${escapeHtml(trend.pillar || "Uncategorized")}</div></div>${trendPill(trend.status)}</div>`).join("")}</div>`
    : emptyState("↗", "Your radar is clear", "Add a topic that is starting to get attention in your niche.", "Add a trend", "trends");
  const topFocus = !profileReady
    ? `<span class="focus-icon">✦</span><p class="focus-title">Set your creative direction</p><p class="focus-copy">Tell the studio what you make and who you make it for. Your ideas will be more relevant from the start.</p><div class="focus-action"><button class="button button-primary button-small" data-page="profile">Set up profile →</button></div>`
    : data.trends.length
      ? `<span class="focus-icon">✳</span><p class="focus-title">Turn a signal into a story</p><p class="focus-copy">Pick one of your saved trend signals and shape it around ${escapeHtml(data.profile.niche)}. Relevance beats chasing every trend.</p><div class="focus-action"><button class="button button-primary button-small" data-page="ideas">Open reel studio →</button></div>`
      : `<span class="focus-icon">↗</span><p class="focus-title">Watch for a pattern, not a spike</p><p class="focus-copy">Save a trend with its source link and a note about why it fits ${escapeHtml(data.profile.niche)}. Then turn it into a reel idea.</p><div class="focus-action"><button class="button button-primary button-small" data-page="trends">Open trend radar →</button></div>`;
  const pillarTags = data.profile.pillars.length
    ? `<div class="pill-row">${data.profile.pillars.slice(0, 6).map((pillar) => `<span class="interest-chip">${escapeHtml(pillar)}</span>`).join("")}</div>`
    : `<p class="small-muted">Add a few content pillars to get more specific prompts.</p>`;
  const plannerContent = nextIdea
    ? `<div class="planner-next"><div class="profile-stat-label">NEXT ON YOUR PLAN · ${formatDate(nextIdea.plannedAt)}</div><div class="trend-name">${escapeHtml(nextIdea.hook)}</div><div class="trend-meta">${plannerStatusPill(nextIdea.status)}</div><button class="text-link" data-page="ideas">Open content planner →</button></div>`
    : `<div class="empty-state compact-empty"><span class="empty-symbol">▤</span><strong>${data.ideas.length ? "Choose a date for an idea" : "Your plan starts with an idea"}</strong><p>${data.ideas.length ? "Set a planned date on a saved reel to see it here." : "Save a reel idea, then organize it through your recording workflow."}</p><button class="button button-secondary button-small" data-page="ideas">Open reel studio</button></div>`;
  return `${heading("YOUR STUDIO", `Good ${greeting()}, ${escapeHtml(data.profile.name.trim() || "creator")}`, "A calmer way to spot ideas, learn from your posts, and plan what to make next.", `<button class="button button-secondary" data-page="profile">Edit profile</button>`)}
    <section class="metric-grid" aria-label="Performance summary">
      <article class="metric-card"><div class="metric-label">Reels tracked <span class="metric-symbol">▤</span></div><div class="metric-value">${formatNumber(reels.length)}</div><div class="metric-note">Your own recorded posts</div></article>
      <article class="metric-card"><div class="metric-label">Avg. engagement / reach <span class="metric-symbol">↗</span></div><div class="metric-value">${reels.length ? formatPercent(averageEngagement) : "—"}</div><div class="metric-note">Likes + comments + saves + shares</div></article>
      <article class="metric-card"><div class="metric-label">Total reach <span class="metric-symbol">◎</span></div><div class="metric-value">${formatNumber(totalReach)}</div><div class="metric-note">Across your tracked reels</div></article>
      <article class="metric-card"><div class="metric-label">Saves + shares <span class="metric-symbol">⌁</span></div><div class="metric-value">${formatNumber(totalSavesShares)}</div><div class="metric-note">Useful audience actions</div></article>
    </section>
    <div class="overview-grid">
      <section class="panel"><div class="panel-heading"><div><h2>Trend radar</h2><p>Your saved signals, organized by stage</p></div><button class="text-link" data-page="trends">View all →</button></div>${trendContent}</section>
      <section class="panel focus-panel"><div class="panel-heading"><div><h2>Next best step</h2></div></div>${topFocus}</section>
      <section class="panel"><div class="panel-heading"><div><h2>Your content pillars</h2><p>Keep ideas anchored in your point of view</p></div><button class="text-link" data-page="profile">Edit →</button></div>${pillarTags}</section>
      <section class="panel"><div class="panel-heading"><div><h2>Content planner</h2><p>Your next scheduled reel idea</p></div></div>${plannerContent}</section>
      <section class="panel"><div class="panel-heading"><div><h2>Honest by design</h2><p>What this studio can—and can't—tell you</p></div><span class="focus-icon">i</span></div><p class="focus-copy">This studio uses the topics and post metrics you enter. It does not connect to Instagram, identify live trends, or reveal Instagram's private ranking formula. Treat performance as directional, then test one change at a time.</p></section>
    </div>`;
}

function renderHelp() {
  return `${heading("INSTINCT FIELD GUIDE", "User manual", "A practical guide to setting up your creator workspace, turning observations into reel plans, and learning from your own results.", `<a class="button button-secondary" href="USER_GUIDE.md" download>Download manual</a>`)}
    <div class="info-banner"><span class="info-icon">i</span><span><strong>What Instinct is:</strong> a browser-based, manual-first creator planning dashboard. It does not sign in to Instagram, automatically find trends, publish content, or fetch account analytics. Your profile, saved signals, planner ideas, and metrics are stored in this browser only.</span></div>
    <div class="manual-layout section-spacer">
      <nav class="manual-toc panel" aria-label="Manual contents">
        <h2>In this guide</h2>
        <a href="#manual-start">1. Getting started</a><a href="#manual-overview">2. Overview</a><a href="#manual-profile">3. Creator profile</a><a href="#manual-trends">4. Trend radar</a><a href="#manual-reels">5. Reel studio &amp; planner</a><a href="#manual-comments">6. Comment drafts</a><a href="#manual-analytics">7. Analytics</a><a href="#manual-backups">8. Backups &amp; sharing</a><a href="#manual-privacy">9. Privacy &amp; limits</a><a href="#manual-faq">10. Troubleshooting</a>
      </nav>
      <article class="panel manual-article">
        <section id="manual-start"><p class="eyebrow">01 · SET UP</p><h2>Getting started</h2><ol><li>Open <strong>My creator profile</strong> and enter your niche, the audience you make content for, your usual voice, and 2–6 content pillars.</li><li>Save your profile. This helps the reel prompts use your creator context.</li><li>Open <strong>Trend radar</strong>. Research a topic using the links there or sources you trust. Save the topic, source link, what you noticed, and the related content pillar.</li><li>Open <strong>Reel studio</strong> from a saved signal. Review the hooks and angles, then save ideas that feel right for your account.</li><li>Use the planner to move ideas through production. After publishing, enter the metrics shown in Instagram Insights under <strong>Analytics</strong>.</li></ol><p class="manual-note">There is no account signup. Each browser profile has its own separate local workspace.</p></section>
        <section id="manual-overview"><p class="eyebrow">02 · ORIENT</p><h2>Overview</h2><p>The Overview page summarizes your manually recorded reel count, average engagement per reach, total reach, and saves plus shares. It also shows saved trend signals, your content pillars, and the next dated planner item. Empty values mean you have not added that information yet—not that Instagram returned zero.</p></section>
        <section id="manual-profile"><p class="eyebrow">03 · YOUR CONTEXT</p><h2>Creator profile</h2><p>Enter your name, niche, audience, region, voice, and comma-separated content pillars. Use clear audience context (for example, “new gardeners with a small balcony”) and a few focused pillars. The profile is used to personalize template-based reel prompts. You can edit it at any time.</p></section>
        <section id="manual-trends"><p class="eyebrow">04 · RESEARCH</p><h2>Trend radar</h2><p>Use Google Trends, Instagram Explore, or other trusted sources to do your own research. For each signal:</p><ul><li>Add a short topic or format name and, if possible, the source URL.</li><li>Write down what you actually noticed and why your audience may care.</li><li>Assign a content pillar and set a stage: <strong>Watching</strong>, <strong>Rising</strong>, <strong>Exploring</strong>, or <strong>Testing</strong>.</li><li>Search or filter saved cards, update a stage as your view changes, open a source link, or remove a signal.</li></ul><p>The stage is your own observation; Instinct does not verify whether a topic is trending.</p></section>
        <section id="manual-reels"><p class="eyebrow">05 · PLAN &amp; CREATE</p><h2>Reel studio and content planner</h2><p>Choose a trend signal to get three starting prompts: hooks, angles, a simple structure, and a call to action. These are local templates—not AI research or a promise of reach. Add your own experience, details, examples, and words before recording.</p><p>Save an idea to the planner. Each saved idea can be moved through <strong>Idea → Scripting → Ready → Scheduled → Published</strong>, and can have a target post date. Remove an idea from the planner when you no longer need it. Planner ideas are kept separate from published-reel analytics.</p></section>
        <section id="manual-comments"><p class="eyebrow">06 · ENGAGE THOUGHTFULLY</p><h2>Comment drafts</h2><p>Describe one specific thing you genuinely want to respond to, select your reason and voice, and generate three options. Edit any draft directly in the text box, then copy it and post it yourself if it feels appropriate. Nothing is sent to Instagram. Avoid generic or repetitive replies and only comment when you have something real to add.</p></section>
        <section id="manual-analytics"><p class="eyebrow">07 · LEARN</p><h2>Analytics</h2><p>After a reel is published, enter the figures from Instagram Insights. Reach is required; the other metrics can be zero. For useful comparisons, record each reel after a similar amount of time.</p><div class="formula-box"><strong>Engagement per reach</strong><span>(likes + comments + saves + shares) ÷ reach × 100</span></div><p>Instinct displays a simple average across the reels you entered and identifies the top tracked reel by this calculation. This is a user-entered metric—not an Instagram score, benchmark, recommendation, or explanation of its ranking system. Compare similar content and look for patterns across several posts.</p></section>
        <section id="manual-backups"><p class="eyebrow">08 · KEEP &amp; SHARE</p><h2>Backups and sharing</h2><p>Use <strong>My creator profile → Download backup</strong> to save your profile, trends, planner, and analytics as a JSON file. Keep that file somewhere safe. To move the workspace to another browser, open Instinct there and use <strong>Import backup</strong>. Import replaces that browser's existing workspace after confirmation.</p><p>To let someone else use Instinct, share the hosted app link—not your backup. A backup contains your workspace data. Each person should use their own browser workspace and should not import your personal backup unless you intend to share that data.</p><p class="manual-note">Opening this folder or file locally does not create an internet link. A shareable URL requires deploying the static app to web hosting. Do not put private account data or credentials in a public site.</p></section>
        <section id="manual-privacy"><p class="eyebrow">09 · BE CLEAR</p><h2>Privacy, requirements, and limitations</h2><ul><li>Instinct currently works in a modern browser with JavaScript and local storage enabled. No installation or Instagram login is needed.</li><li>Your data is stored in the browser on this device. It is not synced between devices or backed up automatically. Clearing this browser's site data may erase it.</li><li>Comment drafts and reel ideas are generated by fixed templates in the app; there is no connected AI service.</li><li>Trend research and Insights must be entered by you. There is no Instagram API connection, scheduling, automatic posting, or live analysis in this version.</li><li>Instagram's full ranking algorithm is not public. No tool can guarantee reach or virality.</li><li>Do not enter passwords, access tokens, private messages, or sensitive personal information.</li></ul></section>
        <section id="manual-faq"><p class="eyebrow">10 · TROUBLESHOOTING</p><h2>Troubleshooting</h2><details><summary>My data disappeared. What happened?</summary><p>Check that you opened Instinct in the same browser and browser profile. Local data is separate per browser and can be deleted by clearing site data. Restore a previous JSON backup from the profile page.</p></details><details><summary>Why can't I see current trends or Instagram Insights?</summary><p>This edition is manual-first and is not connected to Instagram or a live trend service. Use the discovery links, verify a topic yourself, and enter your own Insights numbers.</p></details><details><summary>Can Instinct post comments or schedule reels?</summary><p>No. Comments are editable drafts that you copy; reel dates are reminders in the planner, not Instagram publishing schedules.</p></details><details><summary>How do I share a link with someone?</summary><p>The local file and the 127.0.0.1 address are only available on your device. To make a public link, the static app must be uploaded to a hosting account you control. The guide includes the files and deployment checklist; don't upload private backups.</p></details><details><summary>Where can I report a calculation or display issue?</summary><p>Re-enter the relevant profile, trend, or reel record and check that reach is positive and metrics are whole, non-negative numbers. Export a backup before making major changes.</p></details></section>
      </article>
    </div>`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function renderProfile() {
  const profile = data.profile;
  const allInterests = profile.pillars.length ? profile.pillars.map((pillar) => `<span class="interest-chip">${escapeHtml(pillar)}</span>`).join("") : `<span class="small-muted">No pillars added yet.</span>`;
  return `${heading("YOUR CREATOR PROFILE", "Your point of view", "Give the studio enough context to suggest ideas that sound like you, not everyone else.")}
    <div class="profile-grid">
      <form id="profile-form" class="form-card">
        <div class="form-grid">
          <div class="field"><label for="profile-name">Your name</label><input id="profile-name" name="name" maxlength="60" value="${escapeHtml(profile.name)}" placeholder="How should we address you?"></div>
          <div class="field"><label for="profile-niche">Your niche</label><input id="profile-niche" name="niche" maxlength="80" value="${escapeHtml(profile.niche)}" placeholder="e.g. simple home cooking"></div>
          <div class="field full"><label for="profile-audience">Who do you make content for?</label><textarea id="profile-audience" name="audience" maxlength="500" placeholder="e.g. Busy students who want quick, budget-friendly meals">${escapeHtml(profile.audience)}</textarea></div>
          <div class="field"><label for="profile-region">Location or audience region</label><input id="profile-region" name="region" maxlength="80" value="${escapeHtml(profile.region)}" placeholder="e.g. Mumbai, India"></div>
          <div class="field"><label for="profile-tone">Your usual voice</label><select id="profile-tone" name="tone">${["Warm and conversational", "Playful and witty", "Clear and educational", "Calm and thoughtful", "Bold and energetic", "Personal and candid"].map((tone) => `<option${profile.tone === tone ? " selected" : ""}>${tone}</option>`).join("")}</select></div>
          <div class="field full"><label for="profile-pillars">Content pillars / interests</label><input id="profile-pillars" name="pillars" maxlength="300" value="${escapeHtml(profile.pillars.join(", "))}" placeholder="e.g. quick recipes, kitchen tips, meal prep"><span class="field-hint">Separate with commas. Use 2–6 topics you genuinely want to be known for.</span></div>
        </div>
        <div class="form-actions"><button class="button button-primary" type="submit">Save creator profile</button></div>
      </form>
      <aside class="panel profile-side"><div class="panel-heading"><div><h2>Your creative snapshot</h2><p>Context used for your suggestions</p></div></div>
        <div class="profile-stat"><div class="profile-stat-label">Niche</div><div class="profile-stat-value">${escapeHtml(profile.niche || "Not set yet")}</div></div>
        <div class="profile-stat"><div class="profile-stat-label">Audience</div><div class="small-muted">${escapeHtml(profile.audience || "Add a little context about your audience.")}</div></div>
        <div class="profile-stat"><div class="profile-stat-label">Voice</div><div class="small-muted">${escapeHtml(profile.tone)}</div></div>
        <div class="profile-stat"><div class="profile-stat-label">Content pillars</div><div class="pill-row">${allInterests}</div></div>
        <p class="small-muted">Your profile is saved in this browser only. No account connection or external sync.</p>
      </aside>
    </div>
    <section class="panel section-spacer"><div class="panel-heading"><div><h2>Your data &amp; backups</h2><p>Keep a portable copy of your local workspace.</p></div></div>
      <div class="info-banner"><span class="info-icon">◎</span><span>All workspace content is saved in this browser. Export a backup before clearing browser data or moving to another device. Importing a backup replaces the current workspace.</span></div>
      <div class="form-actions backup-actions"><button class="button button-secondary" type="button" data-action="export-data">Download backup</button><button class="button button-secondary" type="button" data-action="trigger-import">Import backup</button><input class="visually-hidden" id="import-file" type="file" accept="application/json,.json"></div>
    </section>`;
}

function renderTrends() {
  const interests = data.profile.pillars;
  const researchQuery = data.profile.niche || "Instagram Reels";
  const googleTrendsUrl = new URL("https://trends.google.com/trends/explore");
  googleTrendsUrl.searchParams.set("date", "now 7-d");
  googleTrendsUrl.searchParams.set("q", researchQuery);
  const options = [...new Set(interests)].map((pillar) => `<option value="${escapeHtml(pillar)}">${escapeHtml(pillar)}</option>`).join("");
  const trends = [...data.trends].sort(trendSort);
  const cards = trends.length
    ? `<div class="cards-grid" id="trend-cards">${trends.map(renderTrendCard).join("")}</div>`
    : emptyState("↗", "No trend signals saved yet", "Capture a topic you noticed, add its source link, and tell yourself why it might fit your audience.", "Add your first signal", "trends");
  return `${heading("NOTICE → CONNECT → CREATE", "Trend radar", "Collect trend links you find, connect them to your interests, then decide which ones deserve a reel.", `<button class="button button-primary" data-scroll="add-trend">＋ Add a trend signal</button>`)}
    <div class="info-banner"><span class="info-icon">✦</span><span><strong>Human-curated on purpose.</strong> This workspace doesn't scrape Instagram or claim to find live trends. Add the links and observations you discover; the studio helps you evaluate and develop them.</span></div>
    <section class="research-strip section-spacer"><div><strong>Go look for a signal</strong><span>Open discovery sources, verify what is relevant to your audience, then save the link and your own observation below. Google Trends opens a search for your niche; external sites have their own privacy policies.</span></div><div class="research-actions"><a class="button button-secondary button-small" href="${escapeHtml(googleTrendsUrl.href)}" target="_blank" rel="noopener noreferrer">Google Trends ↗</a><a class="button button-secondary button-small" href="https://www.instagram.com/explore/" target="_blank" rel="noopener noreferrer">Instagram Explore ↗</a></div></section>
    <section class="panel section-spacer" id="add-trend"><div class="panel-heading"><div><h2>Save a trend signal</h2><p>Capture enough context to know whether the topic fits your audience.</p></div></div>
      <form id="trend-form">
        <div class="form-grid three">
          <div class="field"><label for="trend-topic">Topic or format *</label><input id="trend-topic" name="topic" required maxlength="120" placeholder="e.g. 15-minute pantry meals"></div>
          <div class="field"><label for="trend-pillar">Related content pillar</label><select id="trend-pillar" name="pillar"><option value="">Choose a pillar</option>${options}<option value="Other">Other</option></select></div>
          <div class="field"><label for="trend-status">What stage is it at?</label><select id="trend-status" name="status"><option>Watching</option><option>Rising</option><option>Exploring</option><option>Testing</option></select></div>
          <div class="field"><label for="trend-source">Source link</label><input id="trend-source" name="source" type="url" maxlength="500" placeholder="https://..."><span class="field-hint">A post, article, search trend, or sound reference you found.</span></div>
          <div class="field full"><label for="trend-note">What did you notice, and why might your audience care?</label><textarea id="trend-note" name="note" maxlength="500" placeholder="Describe the signal and how you could make it genuinely useful or distinctive."></textarea></div>
        </div>
        <div class="form-actions"><button class="button button-primary" type="submit">Save to radar</button></div>
      </form>
    </section>
    <section class="section-spacer"><div class="panel-heading"><div><h2>Saved signals <span class="small-muted">(${trends.length})</span></h2><p>Filter your collection as it grows.</p></div></div>
      ${trends.length ? `<div class="filter-bar"><label class="visually-hidden" for="trend-search">Search saved signals</label><input id="trend-search" type="search" placeholder="Search topics and notes"><label class="visually-hidden" for="trend-filter">Filter by stage</label><select id="trend-filter"><option value="">All stages</option>${["Rising", "Exploring", "Testing", "Watching"].map((status) => `<option>${status}</option>`).join("")}</select></div>${cards}` : cards}
    </section>`;
}

function renderTrendCard(trend) {
  const safeUrl = validHttpUrl(trend.source);
  return `<article class="trend-card" data-trend-card data-topic="${escapeHtml((trend.topic + " " + (trend.note || "") + " " + (trend.pillar || "")).toLowerCase())}" data-status="${escapeHtml(trend.status)}">
    <div class="trend-card-top"><h3>${escapeHtml(trend.topic)}</h3>${trendPill(trend.status)}</div>
    <p class="trend-card-description">${escapeHtml(trend.note || "No observation added yet. Add a note next time you spot this signal.")}</p>
    <div class="trend-card-meta"><span>◎ ${escapeHtml(trend.pillar || "Uncategorized")}</span><span>◷ ${formatDate(trend.createdAt)}</span></div>
    <div class="trend-card-actions"><button class="button button-secondary button-small" data-action="make-idea" data-id="${escapeHtml(trend.id)}">Make reel ideas</button>${safeUrl ? `<a class="button button-quiet button-small" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>` : ""}<label class="visually-hidden" for="trend-stage-${escapeHtml(trend.id)}">Update stage for ${escapeHtml(trend.topic)}</label><select class="trend-stage-select" id="trend-stage-${escapeHtml(trend.id)}" data-trend-field="status" data-id="${escapeHtml(trend.id)}">${["Watching", "Rising", "Exploring", "Testing"].map((status) => `<option${trend.status === status ? " selected" : ""}>${status}</option>`).join("")}</select><button class="icon-button" type="button" aria-label="Delete ${escapeHtml(trend.topic)}" title="Delete signal" data-action="delete-trend" data-id="${escapeHtml(trend.id)}">×</button></div>
  </article>`;
}

function validHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function formatDate(value) {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? "Date unknown" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function renderIdeas() {
  const selected = data.trends.find((trend) => trend.id === ideaTrendId) || data.trends.slice().sort(trendSort)[0];
  const ideaResults = selected ? getIdeas(selected) : [];
  const selectorOptions = data.trends.slice().sort(trendSort).map((trend) => `<option value="${escapeHtml(trend.id)}"${selected && trend.id === selected.id ? " selected" : ""}>${escapeHtml(trend.topic)}</option>`).join("");
  const selectedContext = selected
    ? `<div class="info-banner section-spacer"><span class="info-icon">↗</span><span><strong>Signal: ${escapeHtml(selected.topic)}.</strong> ${escapeHtml(selected.note || "Use the audience and pillar context from your profile to find your unique angle.")} ${selected.pillar ? `Pillar: ${escapeHtml(selected.pillar)}.` : ""}</span></div>`
    : `<div class="panel">${emptyState("✳", "Add a trend signal to begin", "Your ideas are strongest when grounded in a real topic you found and your creator profile.", "Add a trend", "trends")}</div>`;
  const resultMarkup = selected
    ? `<div class="generated-list section-spacer">${ideaResults.map((idea, index) => {
      const alreadySaved = data.ideas.some((savedIdea) => savedIdea.trendId === selected.id && savedIdea.hook === idea.hook);
      return `<article class="reel-card"><div class="reel-card-top"><span class="idea-number">Idea ${String(index + 1).padStart(2, "0")}</span><button class="button ${alreadySaved ? "button-primary" : "button-secondary"} button-small" data-action="save-reel-idea" data-index="${index}" data-trend="${escapeHtml(selected.id)}"${alreadySaved ? " disabled" : ""}>${alreadySaved ? "Saved to planner" : "Save to planner"}</button></div><h3>${escapeHtml(idea.hook)}</h3><p>${escapeHtml(idea.angle)}</p><div class="idea-detail"><div><strong>Simple structure</strong><span>${escapeHtml(idea.beats)}</span></div><div><strong>Try this CTA</strong><span>${escapeHtml(idea.cta)}</span></div></div></article>`;
    }).join("")}</div>`
    : "";
  const savedIdeas = [...data.ideas].sort((a, b) => (a.plannedAt || "9999-12-31").localeCompare(b.plannedAt || "9999-12-31") || b.createdAt.localeCompare(a.createdAt));
  const plannerMarkup = savedIdeas.length
    ? `<section class="section-spacer"><div class="panel-heading"><div><h2>Content planner <span class="small-muted">(${savedIdeas.length})</span></h2><p>Move ideas through your workflow and add a target date. Published ideas stay here until you remove them.</p></div></div><div class="generated-list">${savedIdeas.map((idea) => `<article class="reel-card"><div class="reel-card-top"><span class="idea-number">Saved · ${formatDate(idea.createdAt)}</span>${plannerStatusPill(idea.status)}<button class="delete-button" data-action="delete-idea" data-id="${escapeHtml(idea.id)}">Remove</button></div><h3>${escapeHtml(idea.hook)}</h3><p>${escapeHtml(idea.angle)}</p><div class="idea-detail"><div><strong>Simple structure</strong><span>${escapeHtml(idea.beats)}</span></div><div><strong>Try this CTA</strong><span>${escapeHtml(idea.cta)}</span></div></div><div class="planner-controls"><label class="field"><span>Workflow stage</span><select data-idea-field="status" data-id="${escapeHtml(idea.id)}">${["Idea", "Scripting", "Ready", "Scheduled", "Published"].map((status) => `<option${(idea.status || "Idea") === status ? " selected" : ""}>${status}</option>`).join("")}</select></label><label class="field"><span>Target post date</span><input data-idea-field="plannedAt" data-id="${escapeHtml(idea.id)}" type="date" value="${escapeHtml(idea.plannedAt || "")}"></label></div></article>`).join("")}</div></section>`
    : "";
  return `${heading("YOUR ANGLE → YOUR REEL", "Reel studio", "Turn one saved signal into a few distinct, practical starting points. You bring the lived experience; these prompts help structure it.")}
    <div class="info-banner"><span class="info-icon">✳</span><span><strong>Starter prompts, not AI predictions.</strong> Ideas are generated from reusable templates using your profile and selected trend. Add your specific expertise, examples, and language before recording.</span></div>
    <section class="panel"><div class="panel-heading"><div><h2>Choose a signal</h2><p>The ideas below adapt to your creator profile and the note you saved.</p></div></div>
      ${selected ? `<div class="form-grid"><div class="field"><label for="idea-trend-select">Trend signal</label><select id="idea-trend-select">${selectorOptions}</select></div><div class="field"><label>Your creative context</label><p class="small-muted">${escapeHtml(data.profile.niche || "Set a niche on your creator profile")} · ${escapeHtml(data.profile.tone)}</p></div></div>` : ""}
      ${selectedContext}
    </section>
    ${resultMarkup}
    ${plannerMarkup}
    <p class="small-muted section-spacer">These are creative prompts, not predictions of reach. Make the idea yours and test different hooks, pacing, or formats against your own results.</p>`;
}

function getIdeas(trend) {
  const niche = data.profile.niche.trim() || "your niche";
  const audience = data.profile.audience.trim() || "your audience";
  const pillar = trend.pillar || data.profile.pillars[0] || niche;
  const topic = trend.topic;
  return [
    {
      hook: `“I tried ${topic} so you don’t have to guess.”`,
      angle: `Make a hands-on version for ${audience}. Show your honest take, who it helps, and one thing you would change for ${pillar}.`,
      beats: "Show the result → explain the one useful detail → share your honest verdict.",
      cta: "“Would you try this, or do it another way?”"
    },
    {
      hook: `Three ways to make ${topic} work for ${audience}.`,
      angle: `Adapt the format to your experience in ${niche}. Include one accessible starting point, one personal tip, and one common mistake to avoid.`,
      beats: "Quick promise → 3 clear examples → a concise takeaway on screen.",
      cta: "“Save this for the next time you need an idea.”"
    },
    {
      hook: `The part of ${topic} nobody mentions…`,
      angle: `Use a specific story or useful detail from your own perspective. Connect the trend back to a real question your followers have about ${pillar}.`,
      beats: "Curiosity hook → a specific moment or demonstration → what you learned.",
      cta: "“What should I test or explain next?”"
    }
  ];
}

function renderComments() {
  return `${heading("THOUGHTFUL, NEVER AUTOMATED", "Comment drafts", "Write a genuine, specific response to a post. Review it, edit it, and post it yourself if it feels right.")}
    <div class="info-banner"><span class="info-icon">◎</span><span><strong>Nothing gets posted from here.</strong> The drafts are suggestions only. Avoid repetitive comments, fake engagement, or replies that don't add something real to the conversation.</span></div>
    <section class="panel section-spacer"><div class="panel-heading"><div><h2>What are you responding to?</h2><p>A little detail gives you a more natural draft than a generic “great post”.</p></div></div>
      <form id="comment-form">
        <div class="form-grid">
          <div class="field full"><label for="comment-context">The specific detail you want to respond to *</label><textarea id="comment-context" name="context" required maxlength="1200" placeholder="In one sentence, what did the creator say or show that caught your attention?"></textarea><span class="field-hint">A short, specific detail makes a more natural draft than pasting a whole caption. Don't include private information.</span></div>
          <div class="field"><label for="comment-goal">Your reason for commenting</label><select id="comment-goal" name="goal"><option value="thought">Add a related thought</option><option value="question">Ask a genuine question</option><option value="appreciation">Share specific appreciation</option><option value="experience">Share a related experience</option></select></div>
          <div class="field"><label for="comment-tone">Draft voice</label><select id="comment-tone" name="tone"><option>Warm and conversational</option><option>Playful and witty</option><option>Clear and educational</option><option>Calm and thoughtful</option><option>Bold and energetic</option><option>Personal and candid</option></select></div>
        </div>
        <div class="form-actions"><button class="button button-primary" type="submit">Draft 3 replies</button></div>
      </form>
      <div id="comment-results"></div>
    </section>
    <p class="small-muted section-spacer">Comment drafts are generated in your browser from the context you provide. No comments are submitted to Instagram, and no Instagram account connection is made.</p>`;
}

function createCommentDrafts(context, goal, tone) {
  const cleaned = context.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  const shortContext = cleaned.length > 135 ? `${cleaned.slice(0, 132).trimEnd()}…` : cleaned;
  const friendly = tone.includes("Playful") ? "Okay, this is such a fun" : tone.includes("Bold") ? "Love how clearly you put this" : "I really like how you shared this";
  if (goal === "question") return [
    `${friendly}—what inspired you to explore ${shortContext}?`,
    `Curious about your take on this: what would you recommend someone try first?`,
    `This got me thinking—what part of this has surprised you most?`
  ];
  if (goal === "appreciation") return [
    `${friendly}. That detail about ${shortContext} made the whole thing click for me.`,
    `Appreciate you sharing this—especially the practical perspective. It feels genuinely useful.`,
    `The way you explained this felt really approachable. Thanks for taking the time to share it.`
  ];
  if (goal === "experience") return [
    `This resonated with me. I had a similar experience, and ${shortContext} is exactly the part that stuck with me.`,
    `I can relate to this—it's interesting how much difference one small detail can make.`,
    `I've been thinking about this too. Your perspective gave me a new way to look at it.`
  ];
  return [
    `${friendly}—${shortContext}.`,
    `This is such a useful way to look at it. The detail you shared really stood out to me.`,
    `I hadn't thought about it from this angle before. Thanks for adding this to the conversation.`
  ];
}

function renderAnalytics() {
  const reels = [...data.reels].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const best = reels.reduce((winner, reel) => !winner || reel.engagement > winner.engagement ? reel : winner, null);
  const table = reels.length
    ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Reel</th><th>Date</th><th>Reach</th><th>Engagement / reach</th><th>Saves</th><th>Shares</th><th>Follows</th><th></th></tr></thead><tbody>${reels.map((reel) => `<tr><td>${escapeHtml(reel.title)}</td><td>${formatDate(reel.publishedAt)}</td><td>${formatNumber(reel.reach)}</td><td>${formatPercent(reel.engagement)}</td><td>${formatNumber(reel.saves)}</td><td>${formatNumber(reel.shares)}</td><td>${formatNumber(reel.follows)}</td><td><button class="delete-button" data-action="delete-reel" data-id="${escapeHtml(reel.id)}">Remove</button></td></tr>`).join("")}</tbody></table></div>`
    : `<div class="empty-inline">No reels tracked yet. Add your first reel metrics to start learning from your own results.</div>`;
  return `${heading("LEARN FROM YOUR OWN RESULTS", "Analytics", "Track comparable reel metrics, spot patterns, and form better questions for your next experiment.", `<button class="button button-primary" data-scroll="add-reel">＋ Log a reel</button>`)}
    <div class="info-banner"><span class="info-icon">✦</span><span><strong>Directional, not an algorithm score.</strong> Enter the numbers shown in your Instagram Insights. Engagement / reach = (likes + comments + saves + shares) ÷ reach. These are your inputs—not a prediction or claim about Instagram's ranking formula.</span></div>
    ${best ? `<section class="top-performer section-spacer"><div><div class="top-performer-label">Your strongest tracked reel by engagement / reach</div><div class="top-performer-title">${escapeHtml(best.title)}</div></div><div class="top-performer-rate">${formatPercent(best.engagement)}</div></section>` : ""}
    <section class="panel section-spacer" id="add-reel"><div class="panel-heading"><div><h2>Log reel performance</h2><p>Use metrics from the same time window when comparing posts.</p></div></div>
      <form id="reel-form">
        <div class="form-grid three">
          <div class="field full"><label for="reel-title">Reel title or topic *</label><input id="reel-title" name="title" required maxlength="120" placeholder="e.g. One-pot lentil lunch"></div>
          <div class="field"><label for="reel-date">Published on *</label><input id="reel-date" name="publishedAt" type="date" required value="${localToday()}"></div>
          <div class="field"><label for="reel-reach">Reach *</label><input id="reel-reach" name="reach" type="number" required min="1" step="1" placeholder="e.g. 1200"></div>
          <div class="field"><label for="reel-views">Views / plays</label><input id="reel-views" name="views" type="number" min="0" step="1" placeholder="e.g. 1800"></div>
          <div class="field"><label for="reel-likes">Likes</label><input id="reel-likes" name="likes" type="number" min="0" step="1" value="0"></div>
          <div class="field"><label for="reel-comments">Comments</label><input id="reel-comments" name="comments" type="number" min="0" step="1" value="0"></div>
          <div class="field"><label for="reel-saves">Saves</label><input id="reel-saves" name="saves" type="number" min="0" step="1" value="0"></div>
          <div class="field"><label for="reel-shares">Shares</label><input id="reel-shares" name="shares" type="number" min="0" step="1" value="0"></div>
          <div class="field"><label for="reel-follows">Follows attributed</label><input id="reel-follows" name="follows" type="number" min="0" step="1" value="0"></div>
        </div>
        <div class="form-actions"><button class="button button-primary" type="submit">Save reel metrics</button></div>
      </form>
    </section>
    <section class="panel section-spacer"><div class="panel-heading"><div><h2>Tracked reels <span class="small-muted">(${reels.length})</span></h2><p>Compare your own posts—not someone else's benchmark.</p></div></div>${table}</section>
    <section class="panel section-spacer"><div class="panel-heading"><div><h2>How to use the numbers</h2><p>A small experiment beats trying to reverse-engineer a secret formula.</p></div></div><p class="focus-copy">Compare reels with similar topics and ages. Look for patterns across a few posts: Did a clear first-second hook earn more watch time? Did a useful tutorial get more saves? Change one thing in your next reel so you can learn what made the difference.</p></section>`;
}

function bindPageEvents() {
  const profileForm = document.getElementById("profile-form");
  if (profileForm) profileForm.addEventListener("submit", saveProfile);
  const trendForm = document.getElementById("trend-form");
  if (trendForm) trendForm.addEventListener("submit", addTrend);
  const reelForm = document.getElementById("reel-form");
  if (reelForm) reelForm.addEventListener("submit", addReel);
  const commentForm = document.getElementById("comment-form");
  if (commentForm) commentForm.addEventListener("submit", draftComments);

  pageContent.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.page));
  });
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  });
  const trendSearch = document.getElementById("trend-search");
  const trendFilter = document.getElementById("trend-filter");
  if (trendSearch) trendSearch.addEventListener("input", filterTrendCards);
  if (trendFilter) trendFilter.addEventListener("change", filterTrendCards);
  const ideaSelect = document.getElementById("idea-trend-select");
  if (ideaSelect) ideaSelect.addEventListener("change", () => {
    ideaTrendId = ideaSelect.value;
    render();
  });
  pageContent.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button));
  });
  pageContent.querySelectorAll("[data-idea-field]").forEach((control) => {
    control.addEventListener("change", () => updatePlannedIdea(control));
  });
  pageContent.querySelectorAll("[data-trend-field]").forEach((control) => {
    control.addEventListener("change", () => updateTrendSignal(control));
  });
  const importFile = document.getElementById("import-file");
  if (importFile) importFile.addEventListener("change", importBackup);
}

function saveProfile(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const previousProfile = data.profile;
  data.profile = {
    name: String(form.get("name") || "").trim(),
    niche: String(form.get("niche") || "").trim(),
    audience: String(form.get("audience") || "").trim(),
    region: String(form.get("region") || "").trim(),
    tone: String(form.get("tone") || "Warm and conversational"),
    pillars: [...new Set(String(form.get("pillars") || "").split(",").map((item) => item.trim()).filter(Boolean))]
  };
  if (saveData()) {
    setHeader();
    render();
    showToast("Creator profile saved in this browser.");
  } else {
    data.profile = previousProfile;
  }
}

function addTrend(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const topic = String(form.get("topic") || "").trim();
  const rawSource = String(form.get("source") || "").trim();
  if (rawSource && !validHttpUrl(rawSource)) {
    showToast("Please enter a valid http or https source link.", true);
    return;
  }
  const trend = {
    id: crypto.randomUUID(),
    topic,
    pillar: String(form.get("pillar") || "").trim(),
    status: String(form.get("status") || "Watching"),
    source: rawSource,
    note: String(form.get("note") || "").trim(),
    createdAt: new Date().toISOString()
  };
  data.trends.unshift(trend);
  if (saveData()) {
    ideaTrendId = data.trends[0].id;
    setHeader();
    render();
    showToast("Trend signal saved to your radar.");
  } else {
    data.trends.shift();
  }
}

function numericInput(form, name) {
  const raw = form.get(name);
  if (raw === null || raw === "") return 0;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function addReel(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const fields = ["reach", "views", "likes", "comments", "saves", "shares", "follows"];
  const values = Object.fromEntries(fields.map((name) => [name, numericInput(form, name)]));
  if (Object.values(values).some((value) => value === null)) {
    showToast("Enter whole, non-negative numbers for reel metrics.", true);
    return;
  }
  if (values.reach < 1) {
    showToast("Reach must be at least 1 to calculate engagement.", true);
    return;
  }
  const interactions = values.likes + values.comments + values.saves + values.shares;
  if (!Number.isSafeInteger(interactions)) {
    showToast("The combined interaction count is too large to calculate safely.", true);
    return;
  }
  const publishedAt = String(form.get("publishedAt") || "");
  if (!publishedAt || Number.isNaN(new Date(`${publishedAt}T00:00:00`).getTime())) {
    showToast("Please enter a valid reel publication date.", true);
    return;
  }
  const engagement = (interactions / values.reach) * 100;
  const reel = {
    id: crypto.randomUUID(),
    title: String(form.get("title") || "").trim(),
    publishedAt,
    ...values,
    engagement,
    createdAt: new Date().toISOString()
  };
  data.reels.unshift(reel);
  if (saveData()) {
    render();
    showToast("Reel metrics saved. Keep the comparison window consistent.");
  } else {
    data.reels.shift();
  }
}

function draftComments(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const context = String(form.get("context") || "").trim();
  if (context.length < 8) {
    showToast("Add a little more detail about the post for a relevant draft.", true);
    return;
  }
  const drafts = createCommentDrafts(context, String(form.get("goal")), String(form.get("tone")));
  document.getElementById("comment-results").innerHTML = `<div class="panel-heading section-spacer"><div><h2>Review and edit your drafts</h2><p>Make each reply accurate to the post before copying or posting.</p></div></div><div class="draft-grid">${drafts.map((draft, index) => `<article class="draft-card"><label class="draft-kind" for="comment-draft-${index}">Option ${index + 1}</label><textarea class="draft-edit" id="comment-draft-${index}" maxlength="500">${escapeHtml(draft)}</textarea><button class="button button-secondary button-small" data-action="copy-comment" data-index="${index}">Copy edited draft</button></article>`).join("")}</div>`;
  document.querySelectorAll("#comment-results [data-action='copy-comment']").forEach((button) => button.addEventListener("click", () => {
    const text = document.getElementById(`comment-draft-${button.dataset.index}`).value;
    if (!text.trim()) {
      showToast("Write a comment before copying it.", true);
      return;
    }
    copyDraft(text);
  }));
}

async function copyDraft(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Draft copied. Review it before posting.");
  } catch (error) {
    showToast(`Couldn't copy the draft: ${error.message}. You can select and copy it manually.`, true);
  }
}

function filterTrendCards() {
  const query = (document.getElementById("trend-search")?.value || "").trim().toLowerCase();
  const status = document.getElementById("trend-filter")?.value || "";
  document.querySelectorAll("[data-trend-card]").forEach((card) => {
    const matchesQuery = !query || card.dataset.topic.includes(query);
    const matchesStatus = !status || card.dataset.status === status;
    card.hidden = !(matchesQuery && matchesStatus);
  });
}

function handleAction(button) {
  const { action, id } = button.dataset;
  if (action === "export-data") {
    exportBackup();
  } else if (action === "trigger-import") {
    document.getElementById("import-file")?.click();
  } else if (action === "delete-trend") {
    const trend = data.trends.find((item) => item.id === id);
    if (!trend || !window.confirm(`Remove "${trend.topic}" from your trend radar?`)) return;
    const previousTrends = data.trends;
    data.trends = data.trends.filter((item) => item.id !== id);
    if (ideaTrendId === id) ideaTrendId = "";
    if (saveData()) {
      setHeader();
      render();
      showToast("Trend signal removed.");
    } else {
      data.trends = previousTrends;
    }
  } else if (action === "make-idea") {
    ideaTrendId = id;
    navigate("ideas");
  } else if (action === "save-reel-idea") {
    const trend = data.trends.find((item) => item.id === button.dataset.trend);
    const idea = trend && getIdeas(trend)[Number(button.dataset.index)];
    if (!idea) {
      showToast("That idea is no longer available. Please select a trend again.", true);
      return;
    }
    if (data.ideas.some((savedIdea) => savedIdea.trendId === trend.id && savedIdea.hook === idea.hook)) {
      showToast("This idea is already in your planner.");
      return;
    }
    data.ideas.unshift({ id: crypto.randomUUID(), trendId: trend.id, hook: idea.hook, angle: idea.angle, beats: idea.beats, cta: idea.cta, createdAt: new Date().toISOString(), status: "Idea", plannedAt: "" });
    if (saveData()) {
      render();
      showToast("Idea saved to your planner.");
    } else {
      data.ideas.shift();
    }
  } else if (action === "delete-idea") {
    const idea = data.ideas.find((item) => item.id === id);
    if (!idea || !window.confirm("Remove this idea from your planner?")) return;
    const previousIdeas = data.ideas;
    data.ideas = data.ideas.filter((item) => item.id !== id);
    if (saveData()) {
      render();
      showToast("Saved idea removed.");
    } else {
      data.ideas = previousIdeas;
    }
  } else if (action === "delete-reel") {
    const reel = data.reels.find((item) => item.id === id);
    if (!reel || !window.confirm(`Remove "${reel.title}" from analytics?`)) return;
    const previousReels = data.reels;
    data.reels = data.reels.filter((item) => item.id !== id);
    if (saveData()) {
      render();
      showToast("Reel entry removed.");
    } else {
      data.reels = previousReels;
    }
  }
}

function updatePlannedIdea(control) {
  const idea = data.ideas.find((item) => item.id === control.dataset.id);
  const field = control.dataset.ideaField;
  if (!idea || !["status", "plannedAt"].includes(field)) return;
  const value = control.value;
  if (field === "status" && !["Idea", "Scripting", "Ready", "Scheduled", "Published"].includes(value)) {
    showToast("Choose a valid workflow stage.", true);
    render();
    return;
  }
  if (field === "plannedAt" && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    showToast("Choose a valid target date.", true);
    render();
    return;
  }
  const previousValue = idea[field] || "";
  idea[field] = value;
  if (saveData()) {
    render();
    showToast("Planner updated.");
  } else {
    idea[field] = previousValue;
    render();
  }
}

function updateTrendSignal(control) {
  const trend = data.trends.find((item) => item.id === control.dataset.id);
  const field = control.dataset.trendField;
  if (!trend || field !== "status" || !["Watching", "Rising", "Exploring", "Testing"].includes(control.value)) {
    showToast("Choose a valid trend stage.", true);
    render();
    return;
  }
  const previousStatus = trend.status;
  trend.status = control.value;
  if (saveData()) {
    render();
    showToast("Trend stage updated.");
  } else {
    trend.status = previousStatus;
    render();
  }
}

function exportBackup() {
  try {
    const backup = {
      format: "instinct-studio-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `instinct-backup-${localToday()}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Workspace backup downloaded.");
  } catch (error) {
    showToast(`Could not create a backup: ${error.message}`, true);
  }
}

function validateBackup(backup) {
  if (!backup || backup.format !== "instinct-studio-backup" || backup.version !== 1 || !backup.data) {
    throw new Error("This file is not a supported Instinct backup.");
  }
  const imported = backup.data;
  if (!imported.profile || !Array.isArray(imported.trends) || !Array.isArray(imported.reels) || !Array.isArray(imported.ideas)) {
    throw new Error("The backup is missing profile, trend, reel, or planner data.");
  }
  const validCount = (value) => Number.isSafeInteger(value) && value >= 0;
  if (!imported.trends.every((item) => item && typeof item.id === "string" && typeof item.topic === "string") ||
      !imported.reels.every((item) => item && typeof item.id === "string" && typeof item.title === "string" && validCount(item.reach) && Number.isFinite(item.engagement) && item.engagement >= 0 && ["views", "likes", "comments", "saves", "shares", "follows"].every((field) => validCount(item[field]))) ||
      !imported.ideas.every((item) => item && typeof item.id === "string" && typeof item.hook === "string" && typeof item.angle === "string")) {
    throw new Error("The backup contains an invalid trend, reel, or planner item.");
  }
  const profileTextFields = ["name", "niche", "audience", "region", "tone"];
  if (typeof imported.profile !== "object" || !profileTextFields.every((field) => typeof (imported.profile[field] ?? "") === "string") || !Array.isArray(imported.profile.pillars) || !imported.profile.pillars.every((pillar) => typeof pillar === "string")) {
    throw new Error("The backup's creator profile is invalid.");
  }
  return {
    profile: { ...initialData.profile, ...imported.profile },
    trends: imported.trends,
    reels: imported.reels,
    ideas: imported.ideas.map((idea) => ({ status: "Idea", plannedAt: "", ...idea }))
  };
}

async function importBackup(event) {
  const input = event.currentTarget;
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    const importedData = validateBackup(backup);
    if (!window.confirm(`Import ${importedData.trends.length} trends, ${importedData.ideas.length} planner ideas, and ${importedData.reels.length} reel records? This replaces the current workspace.`)) {
      return;
    }
    const previousData = data;
    data = importedData;
    if (!saveData()) {
      data = previousData;
      return;
    }
    setHeader();
    render();
    showToast("Backup imported successfully.");
  } catch (error) {
    showToast(`Could not import backup: ${error.message}`, true);
  } finally {
    input.value = "";
  }
}

document.querySelectorAll(".nav-item[data-page], .avatar-button[data-page], .help-button[data-page]").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.page));
});
setHeader();
render();
