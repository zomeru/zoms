interface CirclePoint {
  x: number;
  y: number;
  radius: number;
}

interface TrimmedLinePoints {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function getTrimmedLinePoints(from: CirclePoint, to: CirclePoint): TrimmedLinePoints {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    return {
      startX: from.x,
      startY: from.y,
      endX: to.x,
      endY: to.y
    };
  }

  const ux = dx / distance;
  const uy = dy / distance;
  const maxInset = distance / 2;
  const fromInset = Math.min(from.radius, maxInset);
  const toInset = Math.min(to.radius, maxInset);

  return {
    startX: from.x + ux * fromInset,
    startY: from.y + uy * fromInset,
    endX: to.x - ux * toInset,
    endY: to.y - uy * toInset
  };
}
