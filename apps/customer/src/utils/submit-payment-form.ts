export function submitPaymentFormPost(
  action: string,
  fields: Record<string, string>
): boolean {
  if (typeof document === 'undefined') return false;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.style.display = 'none';

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  return true;
}
