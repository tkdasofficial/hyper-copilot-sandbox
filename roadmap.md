# Roadmap

## Done — Copilot replies
- [x] Classify currently supported requests on the server and surface Thinking before their actual action state.
- [x] Render replies with typography instead of visible markup and remove the assistant icon.
- [x] Check action classification, preview compilation, and unsigned access. Authenticated live requests require an app session unavailable in this test environment.

## In progress — Fact video style refinement
- [x] Tune NVIDIA fact scripts and Edge TTS for energetic Hindi/English/Bengali narration
- [x] Tighten stock cuts, short captions, simple editing, and low music
- [x] Generate and review one Hindi test reel (Drive upload succeeded; review exposed mismatched/blank stock, now rejected; strict stock matching needs a fresh full render to confirm)

## Done — ElevenLabs reel voices
- [x] ElevenLabs primary voice with Edge TTS backup in reel engine
- [x] Default ElevenLabs voices per category (male/female), all languages
- [x] Hinglish test reel rendered with ElevenLabs and saved to Drive

## In progress — Video Agent News & Facts reels
- [x] Verify runtime repo, stock keys, Drive Audio Library folder
- [ ] Grouped ≤10-key payload + Drive music pick in dispatcher
- [ ] Real reel engine (script, stock footage, multilingual voice, music, editing templates) in runtime repo
- [ ] Final videos saved only to Google Drive "Videos" folder (no Supabase Storage)
- [ ] Video Agent page: language, visual type, editing template, music count
- [ ] One real end-to-end render


## Done
- [x] Match the Git page's repository, changes, commit, and history layout without inventing repository data.
- [x] Combine Database and Users & Auth inside the Cloud page with clear Supabase, Firebase, and local development states.
- [x] Check both pages at desktop and mobile sizes.
- [x] Fix the Build bottom menu hydration mismatch so its selected window stays centered and [+] remains last.
- [x] Demonstrate Builder Chat's mock multi-cycle thinking, messages, circular Raw Actions, expandable history, and final result without connecting execution services.
- [x] Replace Build add-window launcher with a Tools window and keep Workspace Settings in a separate back-navigable view.
- [x] Keep [+] as the last scrolling window option, insert new tools before it, and center first/last selections.

## Done

- Synchronize the existing Meta Login configuration with the account-linking flow
- Restore rounded workflow controls and keep Customize Creation always accessible
- Repair manual video workflow execution and progress feedback
- Repair automatic scheduling, retries, and schedule activation
- Validate workflow creation and execution through route, migration, and test checks
- Restore circular workflow actions, repair toggles, and replace the browser date picker
- Redesign workflow list and creation screens for a focused mobile layout
- Replace native workflow dropdowns with in-app selection menus
- Clarify creation exclusions as the video negative prompt
- Simplify Video Agent into clean, single-purpose collapsed drawers
- Remove redundant guidance, suggestion, status, and log decoration
- Refine Video Agent page
  - Remove subtitle text under header
  - Clear prefilled prompt / negative prompt placeholders
  - Collapse all drawers by default
- Make rendered videos honor the selected duration and eliminate long narration gaps
- Add Video Agent sidebar entry with custom icon
- Build Video Agent page with prompt, voice, motion, captions, render settings, timeline, console
- Add Video Agent to mobile drawer menu

- [x] Remove visible engine tags from every feature page
- [x] Compact existing page spacing and headers while preserving Copilot composer and hamburger/back navigation

## Done

- [x] Animate Copilot history as a right-side page; open on right-to-left swipe or horizontal scroll and close on reverse gesture
- [x] Open Copilot history on left swipe; move Back, History, and New chat into its header and allow title editing and deletion
- [x] Replace Copilot New/History sub-navigation with direct Copilot entry and in-page swipe history; keep conversations and composer intact
- [x] Add Build workspace (AI Website/WebApp Builder, UI-only): sidebar entry, Chat default page, permanent Preview/Chat, "+" tool launcher, dynamic closable pages, project selector, project-name edit popover, minimize, swipe gestures
- [x] Refine Build workspace navigation, spacing, settings shortcut, and proportional swipeable minimized windows
- [x] Synchronize Build workspace window carousel and center navigation with shared active state and centered snap scrolling
- [x] Center each minimized Build window while scrolling and keep its active selection aligned with the navigation

## Done — Fact video final quality refinement
- [x] Hinglish option, pure English/Hindi rules, 30–50s scripts
- [x] Sentence-level faster Edge TTS, keyword-highlight captions
- [x] Pixabay → Pexels relevance/quality fallback, 1080×1920 @ 60fps H.264 High
- [x] Hinglish test video rendered to Drive
