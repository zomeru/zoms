export function formatDate(dateString: string): string {
  const date = new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return date;
}

export function formatDateWithTime(dateString: string): string {
  const date = new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return date;
}

export function pickOneOrNone<T>(arr: T[], forcePick = false, chance = 0.65): T | undefined {
  if (arr.length === 0) return undefined;

  // 65% (default) chance to pick nothing, unless forcePick is true
  if (!forcePick && Math.random() < chance) return undefined;

  // Pick a random element
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

export function pickRandom<T>(arr: T[], min = 3, max = 5): T[] {
  const n = arr.length;
  if (n === 0) return [];

  // Ensure min/max are within bounds
  const minPick = Math.min(min, n);
  const maxPick = Math.min(max, n);

  // Randomly decide how many to pick
  const count = Math.floor(Math.random() * (maxPick - minPick + 1)) + minPick;

  // Shuffle array and pick first `count` elements
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
