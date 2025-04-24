export const formatDateTime = (dateString: string): string => {
  const d = new Date(dateString);
  const isMobile = window.innerWidth <= 640;
  return d.toLocaleString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    ...(isMobile
    ? { hour: '2-digit', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit', weekday: 'short' }),
  });
};