function endsWithWordCharacter(value: string): boolean {
  return /[\p{L}\p{N})\]]$/u.test(value);
}

function startsWithWordCharacter(value: string): boolean {
  return /^[\p{L}\p{N}(["]/u.test(value);
}

function startsWithJoinablePunctuation(value: string): boolean {
  return /^['’.,!?;:)\]]/u.test(value);
}

export function appendStreamText(current: string, next: string): string {
  if (next.length === 0) {
    return current;
  }

  if (current.length === 0) {
    return next;
  }

  if (
    !/\s$/u.test(current) &&
    !/^\s/u.test(next) &&
    endsWithWordCharacter(current) &&
    startsWithWordCharacter(next) &&
    !startsWithJoinablePunctuation(next)
  ) {
    return `${current} ${next}`;
  }

  return `${current}${next}`;
}
