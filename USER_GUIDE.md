# Instinct — User Guide

Instinct is a local-first dashboard for planning Instagram content and learning from your own posts. It helps you keep your creator context, manually collected trend signals, reel ideas, comment drafts, and manually entered Instagram Insights in one place.

## What Instinct does and does not do

Instinct currently works without an Instagram login, installation, or connected AI service. It saves your information in the current browser's local storage.

It can:

- Store your niche, audience, voice, and content pillars.
- Help you organize trend observations and links that you find.
- Generate template-based starting points for reel hooks, angles, outlines, and calls to action.
- Keep saved reel ideas in a dated production planner.
- Create editable comment drafts for you to review and copy.
- Calculate simple performance metrics from numbers you enter from Instagram Insights.
- Export and restore a JSON workspace backup.

It cannot:

- Log in to Instagram, discover or verify live trends, or import account Insights.
- Publish comments, schedule Instagram posts, or publish reels.
- Explain Instagram's private ranking formula or promise reach, followers, or virality.
- Generate new AI-written content. The reel and comment suggestions use built-in templates.

## Getting started

Prefer a video walkthrough? Watch the [Getting started tutorial](./getting-started.mp4) or [download its captions](./getting-started.srt).

1. Open `index.html` in a modern browser.
2. Select **My creator profile** (the profile button in the top bar or sidebar).
3. Add your niche, describe your audience, select a voice, and add 2–6 comma-separated content pillars.
4. Save the profile.
5. Open **Trend radar** and use its research links or sources you trust to find a signal.
6. Save a topic with its source link and your own note about why it matters to your audience.
7. Open **Reel studio**, select the signal, and save an idea that fits your point of view.
8. Move the idea through the planner as you work on it. After publishing, record its Insights in **Analytics**.

There is no user account or sync. Each browser profile has its own independent workspace.

## Overview

The Overview shows:

- **Reels tracked:** the number of reels with metrics you've entered.
- **Average engagement / reach:** the simple mean of each tracked reel's engagement rate.
- **Total reach:** the sum of recorded reach across those reels.
- **Saves + shares:** the sum of saves and shares you've recorded.
- **Trend radar:** recent saved signals and their stages.
- **Content planner:** the next dated item that is not marked Published.
- **Content pillars:** the topics from your creator profile.

An em dash means no corresponding records have been entered. It does not mean Instagram reported zero.

## Creator profile

Use **My creator profile** to set up or change:

- Your name and niche.
- The audience you make content for.
- A location or audience region for your own reference.
- Your usual writing voice.
- Your content pillars or interests.

The profile is used as context in the built-in reel prompts. Specific audience descriptions and a small number of meaningful pillars produce more useful starting points. These values are not sent to Instagram or an AI service.

## Trend radar

The radar is a manual research notebook; it does not scrape social media or rank current trends.

1. Open **Trend radar**.
2. Open **Google Trends** or **Instagram Explore**, or use another source you trust. These services have their own privacy policies.
3. Record the topic or format you noticed.
4. Choose a related pillar and set the stage:
   - **Watching:** a possible signal to keep an eye on.
   - **Rising:** your observation that it appears to be gaining attention.
   - **Exploring:** checking whether it fits your audience and voice.
   - **Testing:** you have decided to try your own version.
5. Add the source URL and a short note about what you actually observed and why your audience might care.
6. Save the signal. Search or filter the saved cards, change a stage as needed, open the original source, or remove a signal.

Stages are your assessment, not independently verified trend data.

## Reel studio and planner

Select one of your saved trend signals in **Reel studio**. Instinct offers three template-based creative starting points, each with a hook, angle, simple structure, and suggested call to action. Save an idea if you want to keep it.

In **Content planner**, each saved idea has a workflow stage:

1. **Idea**
2. **Scripting**
3. **Ready**
4. **Scheduled**
5. **Published**

You can set or change a target post date. This date is a reminder inside Instinct; it does not schedule a post with Instagram. Saved ideas are kept separate from published reel analytics.

Treat generated prompts as a first draft. Add your own experience, examples, facts, and language before recording.

## Comment drafts

1. Open **Comment drafts**.
2. Describe one specific detail from the post that you genuinely want to respond to.
3. Choose your intention (add a thought, ask a question, share appreciation, or a related experience) and your preferred voice.
4. Generate three options.
5. Edit a draft in its text box, then copy it.
6. Review it for accuracy and relevance; post it yourself only if it feels appropriate.

Instinct never submits comments. Avoid spam, repetitive engagement, pretending to have experiences you have not had, or comments unrelated to the post.

## Analytics

Enter figures from Instagram Insights after a reel has been published. Reach is required and must be at least 1. Other metrics accept whole, non-negative numbers and default to zero. You may also enter views, but views are not currently part of the engagement calculation.

For each reel:

**Engagement per reach = (likes + comments + saves + shares) ÷ reach × 100**

The Overview displays a simple average of the rates for your tracked reels. The Analytics page identifies the reel with the highest entered rate. The calculation is only as accurate as the numbers and timing you enter. For fair comparisons, record metrics after a similar time window and compare similar types of posts.

This is a descriptive calculation on your own data, not an algorithm score, Instagram benchmark, or forecast.

## Backup, restore, and sharing

### Download a backup

1. Open **My creator profile**.
2. Select **Download backup**.
3. Keep the downloaded `instinct-backup-YYYY-MM-DD.json` file somewhere safe.

The backup contains your profile, trends, planner ideas, and tracked reel metrics. It may contain personal workspace information.

### Import a backup

1. Open Instinct in the destination browser.
2. Open **My creator profile** and select **Import backup**.
3. Choose a valid Instinct JSON backup.
4. Confirm the replacement prompt.

Import replaces the destination browser's current workspace. Export the destination data first if you need to preserve it.

### Share the app with someone

Do not send your backup if you only want the other person to use the app. Send the hosted app URL instead. Opening a local file, or an address starting with `127.0.0.1`, only works on your device. A public link requires publishing the static app files to web hosting. Do not publish a backup or any credentials. Each user should keep their own workspace and browser profile.

For a visual walkthrough of downloading and using Instinct, see the [Getting started tutorial](./getting-started.mp4). Captions are available as a separate [SRT file](./getting-started.srt).

#### Easiest publishing route: Netlify Drop

This is a manual upload to a hosting provider; the owner of the Netlify account controls the resulting public site.

1. Locate the `insta agent` folder on your computer. It should contain `index.html`, `app.js`, `styles.css`, and `USER_GUIDE.md`.
2. Sign in to or create your own Netlify account, then open [Netlify Drop](https://app.netlify.com/drop).
3. Drag the `insta agent` folder itself onto the drop area. If your browser or operating system will not upload a folder, make a ZIP containing those four files and upload the ZIP as Netlify Drop instructs.
4. Wait for deployment to finish, then open the generated `https://…netlify.app` address to verify the app and its manual load.
5. Send that public address to the people who should use the app. Each person gets a separate local workspace in their own browser; your saved workspace is not included.

The hosted site is public to anyone with the address unless you configure access controls. Never upload your `instinct-backup-*.json` file. The Google Fonts dependency has been removed; the app itself is static and does not need a server-side API.

## Privacy and data

- Workspace data is saved in local storage for the current browser and website origin.
- Data is not automatically synced between browsers or devices.
- Clearing browser site data may erase your workspace. Keep an exported backup.
- Trend URLs you open go to the external service you chose.
- Do not store passwords, access tokens, private messages, or sensitive personal information in Instinct.

## Troubleshooting

### My information is missing

Check that you opened the same app address in the same browser profile. Different browsers, private windows, or different hosted origins have separate local storage. Restore a backup if available.

### I expected live trends or account metrics

This version is manual-first. Use the research links, evaluate sources yourself, and enter metrics from Instagram Insights.

### I expected comments or posts to publish

Comment drafts are copied for manual review. Planner dates are reminders only. Neither feature connects to or publishes on Instagram.

### I cannot import a file

Use a JSON file exported by Instinct. Import validates the format and asks for confirmation before replacing the current workspace.

### My data did not save

Make sure browser storage is available and not full or disabled. The app displays a notice if it cannot save. Export a backup regularly.
