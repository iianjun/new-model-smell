const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string, label: string) {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  const isRealCalendarDate =
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value;

  if (!DATE_ONLY_PATTERN.test(value) || !isRealCalendarDate) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  return value;
}

export function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
