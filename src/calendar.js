const DAY = 86400000;

export function singaporeParts(value) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date(value));
  const get = type => Number(parts.find(part => part.type === type).value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

export function weekMonday(value) {
  const { year, month, day } = singaporeParts(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = (date.getUTCDay() + 6) % 7;
  return new Date(date.getTime() - weekday * DAY).toISOString().slice(0, 10);
}

export function shiftWeek(monday, weeks) {
  return new Date(Date.parse(`${monday}T00:00:00Z`) + weeks * 7 * DAY).toISOString().slice(0, 10);
}

export function weekDays(monday) {
  const start = Date.parse(`${monday}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start + index * DAY);
    return { key: date.toISOString().slice(0, 10), label: new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(date), number: date.getUTCDate() };
  });
}

export function eventPosition(value, monday) {
  const { year, month, day, hour, minute } = singaporeParts(value);
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayIndex = weekDays(monday).findIndex(item => item.key === key);
  return { dayIndex, minuteOfDay: hour * 60 + minute };
}
