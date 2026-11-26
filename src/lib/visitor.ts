// A stable, anonymous id for this browser.
//
// First visit on a browser mints a random id and keeps it in
// localStorage; every fragment and question sent from that browser
// carries it. It is not a name, an account, or a login — it only says
// "the same browser sent these". If that browser later signs in, the
// rows where the visitor id and a username appear together link the
// two, so a wall owner could one day be shown who a past sender was.
// Nothing about it is ever shown to anyone today.
const KEY = "fragments-visitor-id";

export function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto?.randomUUID === "function"
          ? crypto.randomUUID()
          : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}
