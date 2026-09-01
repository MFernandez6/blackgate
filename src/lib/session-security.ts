/** Staff session policy — idle, window-close, and absolute ceiling. */

export const STAFF_IDLE_MS = 5 * 60 * 1000;
export const STAFF_SESSION_MAX_AGE_S = 8 * 60 * 60;
export const STAFF_SESSION_UPDATE_AGE_S = 30 * 60;

export const STAFF_LOCK_KEY = "blackgate.staff.lock";
export const STAFF_TAB_KEY = "blackgate.staff.tab";
export const STAFF_TABS_KEY = "blackgate.staff.tabs";
export const STAFF_CLOSED_KEY = "blackgate.staff.closed";
