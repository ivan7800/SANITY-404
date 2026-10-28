/** A rendered title frame is not a playable new game. */
export function campaignStartReady(snapshot, previousFrame = -1) {
  return Boolean(
    snapshot?.started &&
    !snapshot.paused &&
    snapshot.overlayHidden &&
    !snapshot.titleTransitionClosed &&
    snapshot.state?.room === 0 &&
    snapshot.state?.health > 0 &&
    snapshot.state?.elapsed > 0 &&
    snapshot.draw?.frame > previousFrame,
  );
}
