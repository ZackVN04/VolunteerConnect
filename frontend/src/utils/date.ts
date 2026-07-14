export const formatDateTimeToISO = (dateStr: string, defaultTime: string): string => {
  if (!dateStr) return '';
  if (dateStr.endsWith('Z') || dateStr.includes('+')) return dateStr;

  let normalized = dateStr.replace(' ', 'T');
  if (!normalized.includes('T')) {
    normalized = `${normalized}T${defaultTime}`;
  }

  const [datePart, timePart] = normalized.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  const localDate = new Date(year, month - 1, day, hours, minutes);
  return localDate.toISOString();
};

export const formatISOToLocalInput = (isoStr: string): string => {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
