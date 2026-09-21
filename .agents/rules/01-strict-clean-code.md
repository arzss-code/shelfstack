# STRICT RULE: PROACTIVE CLEAN CODE & SOP ENFORCEMENT

You MUST ALWAYS apply these rules proactively without waiting for the user to ask:

1. **MAX 300 LINES PER FILE**: If a Vue component (e.g., page or layout) is approaching or exceeding 300 lines, you MUST proactively break it down into smaller, single-responsibility components. Do not write monolithic files.
2. **GLOBAL UI COMPONENTS**: Never write raw Tailwind classes repeatedly for standard UI elements (Buttons, Inputs, Badges, Cards).
   - Check `app/components/ui/` first.
   - If a global component like `UiButton.vue` or `UiInput.vue` doesn't exist, CREATE IT FIRST, then use it.
3. **NO HARDCODING**: Use variables, state, or proper CMS/Database tables instead of hardcoding business values in the template.
4. **READ SOP**: Always follow `SOP-CODING-REPO.md` strictly (e.g., naming conventions, single responsibility).
5. **DO NOT ASK FOR PERMISSION TO REFACTOR BAD CODE**: If you see messy code, inline styles, or duplicated logic in the file you are working on, clean it up proactively as part of your task (Boy Scout Rule).
