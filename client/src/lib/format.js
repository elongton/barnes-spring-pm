export const CATS = { refurbish: 'Refurbish', build: 'Build', purchase: 'Purchase', maintenance: 'Maintenance' };
export const STATUSES = { planned: 'Planned', 'in-progress': 'In progress', 'on-hold': 'On hold', done: 'Done' };

export const money = n => { const v = Number(n) || 0; const cents = Math.round(v * 100) % 100 !== 0; return '$' + v.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }); };
export const initials = n => n.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
export const spent = p => p.lineItems.reduce((a, l) => a + (Number(l.cost) || 0), 0);
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
