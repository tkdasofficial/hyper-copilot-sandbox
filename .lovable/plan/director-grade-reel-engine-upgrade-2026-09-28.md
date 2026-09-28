# Director-grade reel engine upgrade

Upgrade the existing reel engine (the GitHub runtime `reel/render_reel.py`, started through `video-dispatcher`) instead of building a new system. What stays the same: ElevenLabs voice with Edge TTS as backup, Pexels/Pixabay footage, Drive upload, the frame-exact scene cuts, the faster pace, and progress updates on the video row.

## New pipeline (in the same render job)

```text
Topic -> Research + verify -> Hook options -> Story order -> Storyboard + visual bible
-> Footage / infographic per scene -> Voice (word timings) -> Timeline -> Captions
-> Music + SFX -> Critic + fix weak scenes -> Final QA -> Export
```

Each step is its own module, so any provider can be swapped out.

## Phase 1: Story and script
1. **Research and verification:** the existing `web-research` function collects sources, with NASA, ESA, universities and government sites ranked first. The AI pulls out claims, and only claims found in 2 or more sources, or in one authoritative source, get used. Every scene keeps its claims and source links.
2. **Hook generator:** the AI writes 5 hook types (shocking fact, question, comparison, mystery, number) and scores them, and the best one opens the video. "Fact number 1" openers are banned.
3. **Story structure:** hook, setup, surprise, escalation, strongest reveal, payoff. Facts get ordered by curiosity and impact. The ending is a payoff or a curiosity loop, not a hard stop.
4. **Storyboard + visual bible:** each scene gets narration, purpose, shot type, camera, movement, lighting, caption keywords, SFX, music intensity and transition. One palette, grade, font and set of recurring subjects applies to the whole video.
5. **Pronunciation dictionary:** handles NASA, Phobos, Deimos, Olympus Mons, Perseverance and more, and the AI can add entries for each topic. This works together with the existing number normalizer.

## Phase 2: Visuals
6. **Shot-level search:** footage queries are built from the storyboard (subject + shot type), not from generic words. Shot types rotate on purpose, and the same shot type can't repeat back to back.
7. **Relevance check:** a vision model scores sampled frames from each candidate clip against the narration, and the best match wins. Weak matches go to the next candidate or to an infographic.
8. **Repetition detection:** perceptual image hashes of sampled frames are compared across scenes. Near-duplicates get replaced, and the same source clip is never used twice.
9. **Infographic scenes:** when a scene has numbers, percentages, comparisons or dates, it can be drawn as an animated chart, bars, counter or list (for example "95.3% CO2") in the video's palette.
10. **Consistent grade:** one color grade and vignette from the visual bible goes on every clip.

## Phase 3: Voice, captions, sound, pacing
11. **Voice direction:** each scene's emotion (calm, tense, excited, reveal) sets the ElevenLabs stability and style. A short silence goes before the big reveal. Word timings drive everything that follows.
12. **Captions v2:** short 2–4 word chunks with a safe zone. Numbers, names and keywords are highlighted and scaled up. Devanagari and Latin text mix correctly for Hinglish.
13. **Sound design:** whoosh on selected cuts only, an impact on reveals, a riser before the payoff. Music ducks under the voice and a limiter prevents clipping. The SFX set is stored in the Drive Audio Library under an "SFX" folder, and you need to upload it.
14. **Pacing:** scene length follows the narration plus an importance weight, which gives a fast/medium/slow-reveal rhythm.

## Phase 4: Critic, fixes, QA
15. **Critic pass:** the AI reviews the storyboard, the chosen clip frames and the timing for hook, story, relevance, repetition, pacing, captions, facts and ending, then returns a list of scene fixes.
16. **Regeneration loop:** only the flagged scenes get re-searched, re-voiced or turned into infographics, with at most 2 rounds.
17. **Final QA:** checks resolution, FPS, 9:16 framing, black or frozen frames, audio peaks and gaps, loudness, duplicate scenes and duration. A video is marked ready only if it passes. The QA report is saved on the video row.
18. **Scene-level recovery:** scene metadata is stored so one failed scene can be retried without re-rendering the whole video.

## Phase 5: Video Agent page
- Simple by default: topic plus style.
- A new collapsible "Advanced" section: hook style, pacing, music intensity, SFX intensity, creativity, research depth. Voice, visual style, duration and captions stay where they are now.
- The progress display gains new step names (Researching, Storyboarding, Reviewing, QA).
- After a video is done, you can see its sources and QA summary.

## Technical details
- Runtime: split `render_reel.py` into `reel/{research,story,storyboard,visuals,infographics,voice,captions,sound,critic,qa}.py` with a single orchestrator. It's pushed through `sync_runtime`.
- LLM: the existing NVIDIA model handles script, critic and vision scoring (with a fallback if it has no vision support). Perceptual hashes use `imagehash` with Pillow. Infographics are rendered with Pillow frames and ffmpeg.
- Payload: new `direction {hook_style,pacing,music_level,sfx_level,creativity,research_depth}` group. This needs a merge to stay within 10 top-level keys: `stock` gets folded into `visual`.
- DB migration: `videos.scenes jsonb`, `videos.qa_report jsonb`, `videos.sources jsonb`. A new `retry_scene` dispatcher action.
- Cost control: the critic reads the storyboard and frame thumbnails, not the full video. Only a capped number of candidate clips get scored per scene.
- Verification: one Hinglish and one English News & Facts test render, checked through the QA report and the GitHub logs.

## Limits to be aware of
- Footage comes from stock libraries, so some exact visuals (like Phobos and Deimos in orbit) may not exist. In those cases the engine uses an infographic or diagram instead of an unrelated shot.
- Visual similarity uses frame hashes plus vision scoring, not a full embedding model.
