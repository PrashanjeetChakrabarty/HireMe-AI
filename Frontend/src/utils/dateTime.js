// The API sends times as UTC but without a trailing "Z", so browsers would read them
// as local time. Treat them as UTC, so they show correctly in the viewer's timezone.
export const parseApiDate = (value) => {
  if (!value) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value}Z`);
};
