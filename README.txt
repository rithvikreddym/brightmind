BrightMind website

HOW TO OPEN
No installation or npm needed (it is plain HTML, CSS and JavaScript).
- Double-click index.html, or
- In VS Code: install the "Live Server" extension, right-click index.html, choose "Open with Live Server".
Internet is only used for the Inter and Outfit fonts. The site still works offline.

PAGES
index.html       Home
exercises.html   the four activity cards
progress.html    coins and 7-day streak
about.html       About (what it is, the four activities, who it is for, coins and streaks)
why.html         Why Us (the need, what makes BrightMind different)
activity.html    one page that becomes each activity (activity.html#breathing, #meditation, #mindfulness, #music)

THE FOUR ACTIVITIES (Finish unlocks only when the activity is completed)
Breathing    3 min   circle guide: in 4 s, hold 4 s, out 6 s (one round = 14 s). Start and Stop.
Meditation   4 min   six timed guided steps with calm sound, progress bar, Start, Pause, Restart, volume.
Mindfulness  3 min   5-4-3-2-1 exercise: tap once for each thing you notice across five stages.
Calming Music 5 min  choose one of 3 tracks, Play, Pause, volume. The 5 minute timer runs only while music plays.
Finishing any activity gives 10 coins. The first Finish each day fills the next streak circle.
Missing a whole day restarts the streak. Progress is saved with localStorage on the device (no login).

FILES
css/style.css    colours, fonts and spacing are CSS variables at the top
js/script.js     activity steps and timings, audio, streak and coins
images/          4 card illustrations (SVG)
audio/           3 calm loops: calming.mp3 (soft bells), meditation.mp3 (warm pad), mindfulness.mp3 (singing bowls)

CHANGING THINGS
- Activity text and timings: the ACTIVITIES list and the STEPS / STAGES lists in js/script.js.
- Different music: replace the mp3 files in audio/ using the same names.
- Card durations: edit the "3 min" style text in exercises.html.

DEPLOYING TO VERCEL
This is a static site: no build step, no framework, no package.json.
Option 1 (Vercel website): put this folder in a GitHub repository, then on vercel.com choose Add New, Project,
  import the repository. Framework Preset: Other. Build Command: leave empty. Output Directory: leave empty (or "."). Deploy.
Option 2 (command line): in this folder run   npx vercel   then follow the prompts (log in, accept the defaults),
  and run   npx vercel --prod   for the live address.
vercel.json and serve.json switch off "clean URLs" so addresses keep their .html endings.
If sound is quiet: raise the device volume, or use headphones. The tracks sit in the 200 to 2000 Hz range so laptop speakers can play them.
