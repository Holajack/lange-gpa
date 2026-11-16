import type { StudioDict } from "./core";

/**
 * Curriculum copy (phase / part / activity descriptions) that was revised
 * after the original 19-language pass in i18n.ts. Kept here so it can be
 * re-translated with the studio tooling (scripts/studio-i18n.mjs); keys use
 * the same `ph_{phase}_…` scheme as phaseI18n.ts.
 */
export const PHASE_STRINGS: StudioDict = {
  ph_3_act_p3bridge_how: { en: "You know the plot; you don't know the words. Your nurturer tells it while you record. Then you work through the recording together until you follow all of it, log the new words, and listen again at home. Later in the phase you tell it back in your own words." },
  ph_3_act_p3script_desc: { en: "How everyday things are really done here: making tea, a bus ride, a visit to the doctor." },
  ph_3_act_p3script_how: { en: "Your nurturer walks through a routine you've both done, step by step, while you record. You work through the recording, then compare it with how the same thing goes in your home world." },
  ph_3_act_p3cartoon_desc: { en: "A wordless action sequence one of you has seen and the other hasn't." },
  ph_3_act_p3cartoon_how: { en: "The one who saw it tells what happened; the listener puts the scenes in order by ear. Then you swap. The gap between you is what makes the telling real." },
  ph_3_act_p3massage_desc: { en: "The growth loop of Phase 3: your nurturer's recorded telling, worked through until you understand all of it." },
  ph_3_act_p3massage_how: { en: "Record your nurturer telling something. Play it back, flag every spot you lose, and ask about each one in the host language: say it again, break it down, what does that mean, give an example. Log the new words, then listen again clean. The finished recording joins your listening library." },
  ph_3_part_3a_focus: { en: "Stories whose plots you already own, heard in host form for the first time. Your nurturer tells, you record, and together you massage the recording until you follow all of it. The mainstay: at least half of all session time." },
  ph_3_mile1: { en: "Follow a familiar story told at full length, and tell it back in your own words" },
  ph_4_act_p4lifestory_desc: { en: "The most fruitful Phase 4 activity: someone's life story, told their way and explored one telling at a time." },
  ph_4_act_p4lifestory_how: { en: "Ask once for the story of their life, then listen. Record each telling, clear up what you missed, and let what they mention become your next questions. Recorded, clarified, re-listened." },
  ph_4_act_p4tworecorder_desc: { en: "Play a recorded story back with your mentor while a second recorder captures the whole discussion." },
  ph_4_act_p4tworecorder_how: { en: "Recorder one holds the original story. Play it back a stretch at a time while recorder two runs, capturing every question and every longer answer: fifteen-second questions earning five-minute answers. The layered recording is rich listening for months." },
};
