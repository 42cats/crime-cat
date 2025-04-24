export const isWithinDays = (dateStr: string, days: number) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff < days * 24 * 60 * 60 * 1000;
};

export const highlightMatch = (text: string, query: string): (string | JSX.Element)[] => {
  if (!query) return [text];

  const regex = new RegExp(`(${query})`, 'gi');
  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
    <mark key={i} className="bg-yellow-200 text-yellow-800 rounded px-1">
      {part}
    </mark>
    ) : (
    part
    )
  );
  };