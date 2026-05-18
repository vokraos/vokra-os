export function newLaunchReviewId(): string {
  return `lrev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
