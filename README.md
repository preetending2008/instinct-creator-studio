# Instinct

Instinct is a lightweight, approval-first Instagram planning dashboard that runs locally in your browser. Open `index.html` to use it; it does not require an account, package install, or build step.

For setup and detailed instructions for each feature, read the [User Guide](./USER_GUIDE.md) or open **Help & manual** in the dashboard.

## Video walkthrough

Watch the [Getting started tutorial](./getting-started.mp4) to see how to download Instinct from GitHub, open it, set up a creator profile, research a trend, plan a reel, and enter your results. [Download the captions](./getting-started.srt) if you need them separately.

To publish a shareable copy, follow the **Backups, restore, and sharing** section of `USER_GUIDE.md`. The easiest manual route is to upload the static app folder to a hosting account you control. Never publish a workspace backup.

## What it does

- Saves your niche, audience, voice, and content pillars in the browser.
- Organizes trend observations and source links that you add yourself; includes links to Google Trends and Instagram Explore for manual research, and lets you update each signal's stage.
- Creates reel hooks, story angles, outlines, and calls to action from a saved trend and your profile context.
- Keeps selected reel ideas in a content planner with idea, scripting, ready, scheduled, and published stages plus target dates.
- Drafts three context-aware comment options that you can edit and copy. It never posts comments.
- Tracks reel metrics entered from Instagram Insights and calculates engagement as `(likes + comments + saves + shares) / reach`.
- Exports and imports a JSON backup of your profile, saved trends, planner, and analytics.

## Important limits

This version does not connect to Instagram, fetch live trend data, publish content, or read account analytics. Reel and comment suggestions are local templates, not an AI service. Instagram does not expose its full ranking formula; the dashboard reports only directional calculations from the metrics you enter. Treat prompts as starting points and verify trends using sources you trust.

All profile, trend, planner, and reel data is stored in this browser's local storage. Clearing site data in your browser will remove it; export a backup first if you want to keep your workspace or move it to another browser. Avoid entering sensitive or private information.
