// Tells a wall owner by email that something new landed on their wall.
// Fire-and-forget on purpose: the visitor already got their "sent"
// confirmation, and a failed notification must never break the wall.
// keepalive lets the request finish even if they close the tab.
export function notifyWallOwner(
  kind: "fragment" | "question",
  id: string,
): void {
  try {
    void fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
      keepalive: true,
    });
  } catch {
    /* notifications never break the wall */
  }
}
