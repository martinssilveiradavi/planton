---
name: GitHub snapshot sync
description: Safe fallback when a connected GitHub integration is available but local git push cannot authenticate.
---

Avoid force-pushing when the workspace branch and GitHub's default branch have diverged. A connected GitHub OAuth integration does not necessarily provide credentials to the workspace's HTTPS Git remote.

**Rule:** If direct Git push is unavailable and the user chooses a new branch, create a snapshot commit based on the verified remote branch through GitHub's Git Data API. Verify the branch reference and changed blob hashes. Never bypass GitHub push protection; isolate flagged content and omit or sanitize a deployment value only in the remote snapshot unless the user asks to change the local configuration.

**Why:** In this workspace, direct push authentication failed despite an active GitHub connection, and GitHub secret scanning blocked a tracked deployment-config value. A verified snapshot branch avoided rewriting the divergent default branch and kept the local runtime configuration unchanged.

**How to apply:** Check local status and compare branch ancestry first. For a user-approved new-branch sync, use the connected GitHub integration to create blobs, a tree, a commit, and a new ref; stop if secret scanning rejects the snapshot and identify the flagged file without displaying its value.