/* BrightMind: activities, audio, streak and coins */
(function () {
  "use strict";

  var STORAGE_KEY = "brightmind-progress";
  var COINS_PER_ACTIVITY = 10;
  var STREAK_DAYS = 7;

  /* ---------- Saved progress (localStorage, no login) ---------- */
  function emptyProgress() {
    return { coins: 0, streak: 0, lastDate: null };
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyProgress();
      var data = JSON.parse(raw);
      return {
        coins: Number(data.coins) || 0,
        streak: Number(data.streak) || 0,
        lastDate: typeof data.lastDate === "string" ? data.lastDate : null
      };
    } catch (e) {
      return emptyProgress();
    }
  }

  function saveProgress(p) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- Rewards: spend coins on site colours (cosmetic only, saved on this device) ---------- */
  var REWARDS_KEY = "brightmind-rewards";
  var THEMES = [
    { id: "classic", name: "Classic mint", cost: 0, swatch: "#2c7a6b" },
    { id: "ocean", name: "Ocean blue", cost: 20, swatch: "#1f6a8f" },
    { id: "sunset", name: "Sunset orange", cost: 30, swatch: "#a8472a" },
    { id: "lavender", name: "Lavender", cost: 40, swatch: "#6a4fb0" }
  ];

  var ORBS = [
    { id: "teal", name: "Teal (default)", cost: 0, swatch: "#2c7a6b" },
    { id: "coral", name: "Coral", cost: 15, swatch: "#e0654f" },
    { id: "gold", name: "Sunshine gold", cost: 25, swatch: "#e0a526" },
    { id: "violet", name: "Violet", cost: 35, swatch: "#7e5bc4" }
  ];

  function loadRewards() {
    var base = { owned: ["classic", "orb-teal"], theme: "classic", orb: "teal" };
    try {
      var raw = localStorage.getItem(REWARDS_KEY);
      if (!raw) return base;
      var d = JSON.parse(raw);
      var ids = THEMES.map(function (t) { return t.id; }).concat(ORBS.map(function (o) { return "orb-" + o.id; }));
      var owned = Array.isArray(d.owned) ? d.owned.filter(function (id) { return ids.indexOf(id) !== -1; }) : [];
      if (owned.indexOf("classic") === -1) owned.unshift("classic");
      if (owned.indexOf("orb-teal") === -1) owned.push("orb-teal");
      var theme = owned.indexOf(d.theme) !== -1 ? d.theme : "classic";
      var orb = owned.indexOf("orb-" + d.orb) !== -1 ? d.orb : "teal";
      return { owned: owned, theme: theme, orb: orb };
    } catch (e) {
      return base;
    }
  }

  function saveRewards(r) {
    try { localStorage.setItem(REWARDS_KEY, JSON.stringify(r)); return true; } catch (e) { return false; }
  }

  function applyTheme(id) {
    if (id && id !== "classic") document.documentElement.setAttribute("data-theme", id);
    else document.documentElement.removeAttribute("data-theme");
  }

  function applyOrb(id) {
    if (id && id !== "teal") document.documentElement.setAttribute("data-orb", id);
    else document.documentElement.removeAttribute("data-orb");
  }

  function resetRewards() {
    saveRewards({ owned: ["classic", "orb-teal"], theme: "classic", orb: "teal" });
    applyTheme("classic");
    applyOrb("teal");
  }

  function dateKey(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function todayKey() { return dateKey(new Date()); }

  function yesterdayKey() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return dateKey(d);
  }

  /* Streak shown on the page: resets to 0 if a full day was missed */
  function currentStreak(p) {
    if (!p.lastDate) return 0;
    if (p.lastDate === todayKey() || p.lastDate === yesterdayKey()) return p.streak;
    return 0;
  }

  function completeActivity() {
    var p = loadProgress();
    var today = todayKey();
    var streakNow = currentStreak(p);
    var firstToday = p.lastDate !== today;

    p.coins += COINS_PER_ACTIVITY;
    if (firstToday) {
      p.streak = streakNow + 1;
      p.lastDate = today;
    } else {
      p.streak = streakNow;
    }
    var saved = saveProgress(p);
    return { progress: p, firstToday: firstToday, saved: saved };
  }

  function fmt(s) {
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + String(r).padStart(2, "0");
  }

  /* ---------- Progress page ---------- */
  function renderShopList(listId, items, kind, onChange) {
    var box = document.getElementById(listId);
    if (!box) return;
    var msg = document.getElementById("shop-msg");
    var p = loadProgress();
    var r = loadRewards();
    var prefix = kind === "orb" ? "orb-" : "";
    var current = kind === "orb" ? r.orb : r.theme;
    box.innerHTML = "";

    items.forEach(function (t) {
      var key = prefix + t.id;
      var owned = r.owned.indexOf(key) !== -1;
      var li = document.createElement("li");
      li.className = "shop-item";

      var sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.background = t.swatch;
      sw.setAttribute("aria-hidden", "true");

      var name = document.createElement("span");
      name.className = "shop-name";
      name.textContent = t.name;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn small";

      function equip(rr) {
        if (kind === "orb") { rr.orb = t.id; applyOrb(t.id); } else { rr.theme = t.id; applyTheme(t.id); }
      }

      if (owned && current === t.id) {
        btn.textContent = "In use";
        btn.disabled = true;
      } else if (owned) {
        btn.textContent = "Use";
        btn.className += " btn-ghost";
        btn.addEventListener("click", function () {
          equip(r);
          saveRewards(r);
          msg.textContent = t.name + " is on.";
          onChange();
        });
      } else {
        btn.textContent = "Buy for " + t.cost;
        btn.disabled = p.coins < t.cost;
        btn.addEventListener("click", function () {
          var cur = loadProgress();
          var rr = loadRewards();
          if (cur.coins < t.cost) { msg.textContent = "Not enough coins yet."; return; }
          cur.coins -= t.cost;
          rr.owned.push(key);
          equip(rr);
          if (!saveProgress(cur) || !saveRewards(rr)) {
            msg.textContent = "Could not save on this device. Check that your browser allows site storage.";
          } else {
            msg.textContent = "You bought " + t.name + " for " + t.cost + " coins and it is on.";
          }
          onChange();
        });
      }

      li.appendChild(sw);
      li.appendChild(name);
      li.appendChild(btn);
      box.appendChild(li);
    });
  }

  function initShopPage() {
    var coinEl = document.getElementById("shop-coins");
    if (!coinEl) return;
    function render() {
      coinEl.textContent = loadProgress().coins;
      renderShopList("shop-themes", THEMES, "theme", render);
      renderShopList("shop-orbs", ORBS, "orb", render);
    }
    render();
  }

  function initProgressPage() {
    var coinEl = document.getElementById("coin-count");
    var streakEl = document.getElementById("streak");
    if (!coinEl || !streakEl) return;

    function render() {
      var p = loadProgress();
      var s = Math.min(currentStreak(p), STREAK_DAYS);
      coinEl.textContent = p.coins;

      var dots = streakEl.querySelectorAll(".dot");
      dots.forEach(function (dot, i) {
        var done = i < s;
        dot.classList.toggle("done", done);
        dot.textContent = done ? "✓" : "";
      });

      var status = document.getElementById("streak-status");
      if (s === 0) {
        status.textContent = "Finish an activity to start your streak.";
      } else if (s >= STREAK_DAYS) {
        status.textContent = "Seven days in a row. Great work, keep it going!";
      } else {
        status.textContent = "Day " + s + " done. Keep your streak alive tomorrow.";
      }
    }

    var reset = document.getElementById("reset-progress");
    if (reset) {
      reset.addEventListener("click", function () {
        if (window.confirm("Reset your coins, streak and bought colours on this device?")) {
          saveProgress(emptyProgress());
          resetRewards();
          render();
        }
      });
    }
    render();
  }

  /* ---------- Activity page ---------- */
  var ACTIVITIES = {
    breathing: {
      title: "Breathing",
      intro: "Sit comfortably with your back supported and your feet flat on the floor. Rest your hands in your lap, let your shoulders drop, then press Start. If you feel dizzy, press Stop and breathe normally.",
      panel: "act-breathing"
    },
    meditation: {
      title: "Meditation",
      intro: "Find a quiet spot where you can sit or lie down. Headphones help. Press Start and let the steps on the screen guide you through six short stages.",
      panel: "act-meditation"
    },
    mindfulness: {
      title: "Mindfulness",
      intro: "This is the 5-4-3-2-1 exercise. It pulls your attention away from worries and into the room around you. Tap once for every thing you notice.",
      panel: "act-mindfulness"
    },
    music: {
      title: "Calming Music",
      intro: "Put your phone and books to one side and sit comfortably. Pick a track, press Play, and just listen. If your mind wanders, follow one sound until it fades.",
      panel: "act-music"
    }
  };

  var finishBtn, finishHint, finishNote, completed = false, finished = false;
  var audio, audioMsg;
  var lastFailMsg = "The sound could not play.";
  var audioFailHook = null;

  function showAudioMsg(text) {
    if (audioMsg) audioMsg.textContent = text;
  }

  /* Called when a sound cannot load or play. Tells the student and lets the activity react. */
  function audioFailed() {
    showAudioMsg(lastFailMsg);
    if (audioFailHook) audioFailHook();
  }

  function unlockFinish(message) {
    if (completed) return;
    completed = true;
    finishBtn.disabled = false;
    finishHint.textContent = message || "Well done. You can collect your coins now.";
  }

  function playAudio(src, volume, failMsg) {
    if (failMsg) lastFailMsg = failMsg;
    if (src && audio.getAttribute("data-src") !== src) {
      audio.setAttribute("data-src", src);
      audio.src = src;
    }
    audio.volume = volume;
    var attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch(function (err) {
        /* Switching tracks interrupts the previous play() call. That is not a failure. */
        if (err && err.name === "AbortError") return;
        audioFailed();
      });
    }
  }

  function initActivityPage() {
    var titleEl = document.getElementById("activity-title");
    if (!titleEl || !document.getElementById("finish-panel")) return;

    finishBtn = document.getElementById("btn-finish");
    finishHint = document.getElementById("finish-hint");
    finishNote = document.getElementById("finish-note");
    audio = document.getElementById("audio");
    audioMsg = document.getElementById("audio-msg");
    audio.addEventListener("error", audioFailed);
    audio.addEventListener("playing", function () { showAudioMsg(""); });

    /* The hash (activity.html#breathing) survives server redirects; ?a=breathing still works too. */
    var key = window.location.hash.replace("#", "") || new URLSearchParams(window.location.search).get("a");
    var activity = ACTIVITIES[key];

    if (!activity) {
      titleEl.textContent = "Activity not found";
      var intro = document.getElementById("activity-intro");
      intro.innerHTML = 'Please choose an exercise from the <a href="exercises.html">Exercises page</a>.';
      document.getElementById("finish-panel").hidden = true;
      return;
    }

    document.title = activity.title + " | BrightMind";
    titleEl.textContent = activity.title;
    document.getElementById("activity-intro").textContent = activity.intro;
    document.getElementById(activity.panel).hidden = false;

    if (key === "breathing") initBreathing();
    if (key === "meditation") initMeditation();
    if (key === "mindfulness") initMindfulness();
    if (key === "music") initMusic();

    finishBtn.addEventListener("click", function () {
      if (!completed || finished) return;
      finished = true;
      finishBtn.disabled = true;
      var result = completeActivity();
      var msg = "+" + COINS_PER_ACTIVITY + " coins. You now have " + result.progress.coins + ".";
      if (result.firstToday) {
        var s = Math.min(result.progress.streak, STREAK_DAYS);
        msg += " Streak: " + s + " day" + (s === 1 ? "" : "s") + ".";
      } else {
        msg += " Today's streak is already counted.";
      }
      if (!result.saved) msg += " Progress could not be saved in this browser.";
      finishNote.textContent = "";
      finishNote.appendChild(document.createTextNode(msg + " "));
      var link = document.createElement("a");
      link.href = "progress.html";
      link.textContent = "See your progress";
      finishNote.appendChild(link);
      finishHint.textContent = "Activity complete.";
    });

    window.addEventListener("pagehide", function () { audio.pause(); });
  }

  /* ---------- 1. Breathing: in 4 s, hold 4 s, out 6 s, for 3 minutes ---------- */
  function initBreathing() {
    var PHASES = [
      { name: "Breathe in", seconds: 4, scale: 1.8 },
      { name: "Hold", seconds: 4, scale: 1.8 },
      { name: "Breathe out", seconds: 6, scale: 1 }
    ];
    var TOTAL_SECONDS = 180;

    var circle = document.getElementById("breath-circle");
    var label = document.getElementById("breath-label");
    var phaseCount = document.getElementById("phase-count");
    var timeLeft = document.getElementById("time-left");
    var start = document.getElementById("breath-start");
    var stop = document.getElementById("breath-stop");

    var timer = null;
    var remaining = TOTAL_SECONDS;
    var phaseIndex = 0;
    var phaseRemaining = 0;

    function enterPhase(i) {
      phaseIndex = i;
      phaseRemaining = PHASES[i].seconds;
      label.textContent = PHASES[i].name;
      circle.style.transitionDuration = PHASES[i].seconds + "s";
      circle.style.transform = "scale(" + PHASES[i].scale + ")";
      phaseCount.textContent = phaseRemaining;
    }

    function reset(text) {
      clearInterval(timer);
      timer = null;
      remaining = TOTAL_SECONDS;
      circle.style.transitionDuration = "0.4s";
      circle.style.transform = "scale(1)";
      label.textContent = text;
      phaseCount.textContent = "0";
      timeLeft.textContent = fmt(TOTAL_SECONDS);
      start.disabled = false;
      stop.disabled = true;
    }

    function tick() {
      remaining--;
      phaseRemaining--;
      timeLeft.textContent = fmt(remaining);
      if (remaining <= 0) {
        reset("Well done");
        unlockFinish("Three minutes of breathing done. You can collect your coins now.");
        return;
      }
      if (phaseRemaining <= 0) {
        enterPhase((phaseIndex + 1) % PHASES.length);
      } else {
        phaseCount.textContent = phaseRemaining;
      }
    }

    start.addEventListener("click", function () {
      if (timer) return;
      remaining = TOTAL_SECONDS;
      timeLeft.textContent = fmt(remaining);
      start.disabled = true;
      stop.disabled = false;
      enterPhase(0);
      timer = setInterval(tick, 1000);
    });

    stop.addEventListener("click", function () { reset("Stopped"); });
    window.addEventListener("pagehide", function () { clearInterval(timer); });
    reset("Ready");
    finishHint.textContent = "Finish the 3 minute breathing timer to unlock your coins.";
  }

  /* ---------- 2. Guided meditation: six timed steps, 4 minutes ---------- */
  function initMeditation() {
    var STEPS = [
      { seconds: 30, text: "Get comfortable. Sit or lie down, let your shoulders drop and rest your hands." },
      { seconds: 40, text: "Close your eyes, or rest your gaze on one spot. Take three slow breaths." },
      { seconds: 60, text: "Bring your attention to your breath. Notice the air moving in and out without changing it." },
      { seconds: 70, text: "When a thought about school appears, say \"thinking\" in your head and gently come back to your breath." },
      { seconds: 30, text: "Let your jaw, shoulders and hands soften. Notice how your body feels now." },
      { seconds: 10, text: "Slowly wiggle your fingers and toes. When you are ready, open your eyes." }
    ];
    var TOTAL = STEPS.reduce(function (a, s) { return a + s.seconds; }, 0);

    var stepLabel = document.getElementById("med-step-label");
    var bar = document.getElementById("med-bar");
    var text = document.getElementById("med-text");
    var timeEl = document.getElementById("med-time");
    var orb = document.getElementById("med-orb");
    var start = document.getElementById("med-start");
    var pause = document.getElementById("med-pause");
    var restart = document.getElementById("med-reset");
    var vol = document.getElementById("med-vol");

    var elapsed = 0;
    var timer = null;

    function stepIndex() {
      var t = 0;
      for (var i = 0; i < STEPS.length; i++) {
        t += STEPS[i].seconds;
        if (elapsed < t) return i;
      }
      return STEPS.length - 1;
    }

    function render() {
      var i = stepIndex();
      stepLabel.textContent = "Step " + (i + 1) + " of " + STEPS.length;
      text.textContent = STEPS[i].text;
      bar.style.width = (elapsed / TOTAL * 100) + "%";
      timeEl.textContent = fmt(TOTAL - elapsed);
    }

    function stopTimer() {
      clearInterval(timer);
      timer = null;
      orb.classList.remove("running");
    }

    function tick() {
      elapsed++;
      if (elapsed >= TOTAL) {
        elapsed = TOTAL;
        stopTimer();
        audio.pause();
        stepLabel.textContent = "Complete";
        text.textContent = "Session complete. Take a moment before you go back to what you were doing.";
        bar.style.width = "100%";
        timeEl.textContent = "0:00";
        start.disabled = true;
        pause.disabled = true;
        restart.disabled = false;
        unlockFinish("Meditation done. You can collect your coins now.");
        return;
      }
      render();
    }

    start.addEventListener("click", function () {
      if (timer) return;
      if (elapsed >= TOTAL) elapsed = 0;
      render();
      playAudio("audio/meditation.mp3", Number(vol.value),
        "The sound could not play. You can continue the session without it, or check your volume and press Restart.");
      orb.classList.add("running");
      timer = setInterval(tick, 1000);
      start.disabled = true;
      pause.disabled = false;
      restart.disabled = false;
    });

    pause.addEventListener("click", function () {
      stopTimer();
      audio.pause();
      start.textContent = "Resume";
      start.disabled = false;
      pause.disabled = true;
    });

    restart.addEventListener("click", function () {
      stopTimer();
      audio.pause();
      elapsed = 0;
      render();
      text.textContent = "Press Start when you are ready. Sound will begin softly.";
      start.textContent = "Start";
      start.disabled = false;
      pause.disabled = true;
      restart.disabled = true;
    });

    vol.addEventListener("input", function () { audio.volume = Number(vol.value); });
    window.addEventListener("pagehide", stopTimer);
    finishHint.textContent = "Finish the 4 minute guided session to unlock your coins.";
  }

  /* ---------- 3. Mindfulness: 5-4-3-2-1 grounding ---------- */
  function initMindfulness() {
    var STAGES = [
      { n: 5, title: "5 things you can see", text: "Look around slowly. Tap once for each different thing you notice, such as a colour, a shape or a light." },
      { n: 4, title: "4 things you can feel", text: "Notice your feet on the floor, your clothes on your skin, the chair under you, the air on your face." },
      { n: 3, title: "3 things you can hear", text: "Listen. It could be a fan, voices far away or your own breathing." },
      { n: 2, title: "2 things you can smell", text: "Breathe in gently. If you cannot smell anything, think of two smells you like." },
      { n: 1, title: "1 thing you can taste", text: "Notice the taste in your mouth, or imagine a taste you enjoy. Then take one slow breath." }
    ];

    var stageLabel = document.getElementById("mf-stage-label");
    var bar = document.getElementById("mf-bar");
    var title = document.getElementById("mf-title");
    var text = document.getElementById("mf-text");
    var taps = document.getElementById("mf-taps");
    var count = document.getElementById("mf-count");
    var sound = document.getElementById("mf-sound");

    var stage = 0;
    var tapped = 0;

    function renderStage() {
      var s = STAGES[stage];
      stageLabel.textContent = "Stage " + (stage + 1) + " of " + STAGES.length;
      bar.style.width = (stage / STAGES.length * 100) + "%";
      title.textContent = s.title;
      text.textContent = s.text;
      taps.innerHTML = "";
      tapped = 0;
      for (var i = 0; i < s.n; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tap";
        b.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-label", "Thing " + (i + 1) + " of " + s.n);
        b.textContent = String(i + 1);
        b.addEventListener("click", onTap);
        taps.appendChild(b);
      }
      count.textContent = "0 of " + s.n + " noticed";
    }

    function onTap(e) {
      var b = e.currentTarget;
      if (b.getAttribute("aria-pressed") === "true") return;
      b.setAttribute("aria-pressed", "true");
      b.classList.add("on");
      b.disabled = true;
      tapped++;
      var s = STAGES[stage];
      count.textContent = tapped + " of " + s.n + " noticed";
      if (tapped >= s.n) {
        setTimeout(nextStage, 700);
      }
    }

    function nextStage() {
      if (stage < STAGES.length - 1) {
        stage++;
        renderStage();
      } else {
        bar.style.width = "100%";
        stageLabel.textContent = "Complete";
        title.textContent = "All done";
        text.textContent = "You brought your attention back to the present moment. Take one more slow breath.";
        taps.innerHTML = "";
        count.textContent = "";
        unlockFinish("Mindfulness done. You can collect your coins now.");
      }
    }

    audioFailHook = function () { sound.textContent = "Play"; };

    sound.addEventListener("click", function () {
      if (audio.paused) {
        playAudio("audio/mindfulness.mp3", 0.8,
          "The calming sound could not play. You can still do the exercise without it.");
        sound.textContent = "Pause";
      } else {
        audio.pause();
        sound.textContent = "Play";
      }
    });

    renderStage();
    finishHint.textContent = "Work through all five stages to unlock your coins.";
  }

  /* ---------- 4. Calming music: 5 minutes of listening ---------- */
  function initMusic() {
    var TOTAL = 300;
    var timeEl = document.getElementById("mu-time");
    var play = document.getElementById("mu-play");
    var pause = document.getElementById("mu-pause");
    var vol = document.getElementById("mu-vol");
    var eq = document.getElementById("eq");
    var radios = document.querySelectorAll('input[name="track"]');

    var remaining = TOTAL;
    var playing = false;
    var timer = null;

    function selectedTrack() {
      for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) return radios[i].value;
      }
      return radios[0].value;
    }

    function setPlaying(on) {
      playing = on;
      eq.classList.toggle("playing", on);
      play.disabled = on || remaining <= 0;
      pause.disabled = !on;
    }

    /* The timer follows what the audio is really doing, so it never counts down in silence. */
    audio.addEventListener("playing", function () { setPlaying(true); });
    audio.addEventListener("pause", function () { setPlaying(false); });
    audioFailHook = function () { setPlaying(false); };

    function tick() {
      if (!playing || audio.paused) return;
      remaining--;
      timeEl.textContent = fmt(Math.max(remaining, 0));
      if (remaining <= 0) {
        clearInterval(timer);
        timer = null;
        audio.pause();
        setPlaying(false);
        play.disabled = true;
        unlockFinish("Five minutes of calm listening done. You can collect your coins now.");
      }
    }

    var FAIL = "This track could not play. Check your device volume or choose another track.";

    play.addEventListener("click", function () {
      playAudio(selectedTrack(), Number(vol.value), FAIL);
      if (!timer) timer = setInterval(tick, 1000);
    });

    pause.addEventListener("click", function () {
      audio.pause();
    });

    radios.forEach(function (r) {
      r.addEventListener("change", function () {
        if (playing) playAudio(selectedTrack(), Number(vol.value), FAIL);
      });
    });

    vol.addEventListener("input", function () { audio.volume = Number(vol.value); });
    window.addEventListener("pagehide", function () { clearInterval(timer); });

    timeEl.textContent = fmt(TOTAL);
    setPlaying(false);
    finishHint.textContent = "Listen for 5 minutes to unlock your coins.";
  }

  /* ---------- Start ---------- */
  (function () { var r = loadRewards(); applyTheme(r.theme); applyOrb(r.orb); })();

  document.addEventListener("DOMContentLoaded", function () {
    initProgressPage();
    initShopPage();
    initActivityPage();
  });
})();
