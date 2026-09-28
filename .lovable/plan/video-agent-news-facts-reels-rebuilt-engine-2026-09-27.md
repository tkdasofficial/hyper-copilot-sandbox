# Video Agent: News & Facts reels, rebuilt engine

## What the check found
- The GitHub runtime repo (tkdasofficial/hyper-copilot-runtime) is reachable with the saved PAT, and it can start renders. The reel and long-video workflows exist.
- Pexels and Pixabay keys are saved in Supabase.
- An **"Audio Library"** folder now exists in your Drive storage folder. It's empty, so it's ready for your uploads.
- **The engine doesn't make real videos yet.** It ignores the prompt and always uses fixed "deep ocean" search words. It never downloads the stock clips, so every scene is a colored noise block. The narration and music are test tones, and the captions are placeholder text. Most recent reel runs failed.

## What will be built

### 1. Reel engine (in the runtime repo, reel workflow)
The fake steps get replaced by a real pipeline: Python, ffmpeg, edge-tts. The workflow already installs all three.
1. **Script:** NVIDIA AI turns the prompt, negative prompt and category into a scene-by-scene script. News & Facts supports two formats:
   - Lists: "Top 5 facts about NASA", "Top 10 facts about the Universe"
   - Single-topic explainers: "How SpaceX builds the most powerful rockets"
   Each scene gets narration text plus stock-footage search words. The negative prompt steers the script and filters out matching footage.
2. **Footage:** searches Pexels and Pixabay for each scene in the right orientation. It downloads the best clip and avoids repeats.
3. **Voice:** edge-tts in English, Hindi or Bengali, male or female, with word timings for captions.
4. **Music:** picks a track from the Drive Audio Library by matching filename tags to the category and topic, and lowers the music under the voice. No music if it's turned off or the folder is empty.
5. **Editing templates:** Zoom In/Out, keyframed pan (Ken Burns), speed ramp, vignette/mask, overlay (fact number badge and lower-third title), and animated word captions. Captions can be on or off, in three styles and sizes.
6. Upload to Drive and update progress on the video row, same as today.

### 2. Settings sent to the engine (10-property limit)
GitHub allows at most 10 top-level properties. All settings go in as grouped sub-properties:
`identity {video_id,user_id}`, `content {prompt,negative_prompt,category,format}`, `visual {visual_type,style,aspect_ratio,resolution,fps}`, `audio {language,voice_gender,voice}`, `music {enabled,track_id,track_name}`, `captions {enabled,style,size}`, `edit {template,zoom,speed,overlay,transitions}`, `timing {duration_seconds}`, `stock {sources}`, `meta {version}`.
Only 10 top-level keys are used. The old flat keys are still read, so earlier requests keep working.

### 3. Video Agent page
- New **Language** option: English, Hindi, Bengali.
- New **Visual type**: Stock footage (the default for News & Facts) or AI images.
- New **Editing template**: Dynamic, Documentary, Minimal, Fast Cuts.
- Background music says it comes from your Audio Library and shows the track count.

### Naming your music files
Put tags in brackets or after #, for example:
`Rising Tension [news, facts, suspense].mp3` or `Space Drift #space #science #calm.mp3`

## Not included
- Automatic Google sign-in with GOOGLE_MAIL_ID / GOOGLE_MAIL_PASSWORD. It's replaced by the Drive Audio Library.
- Long-form (16:9) engine rewrite. That can come next with the same design.

## Technical details
- Edge function `video-dispatcher`: `buildClientPayload` switches to the grouped shape and picks the music track server-side (`pickMusic`). New `verify_env` and `music` actions, limited to the service role or worker token. It gets redeployed.
- Runtime repo: add `reel/render_reel.py` plus editing-template JSON under `reel/templates/`. `create-reel.yml` exports the grouped payload as `PAYLOAD_JSON`, runs the script, and keeps the Supabase status steps. It gets pushed with the PAT.
- `video-agent.functions.ts` / `.server.ts`: new fields stored in the row (language in `voice_persona` metadata, template in `motion_template`). The page reads the track count through a server function.
- Verify with one real short News & Facts render end to end.
