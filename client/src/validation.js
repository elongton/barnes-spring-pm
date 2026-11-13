export const CATEGORIES = ['refurbish', 'build', 'purchase', 'maintenance'];
export const STATUSES = ['planned', 'in-progress', 'on-hold', 'done'];
export const PERSON_TYPES = ['household', 'contractor'];
export const REPEAT_UNITS = ['week', 'month', 'year'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

const str = (v, name, { required = false, max = 2000 } = {}) => {
  if (v === undefined || v === null) {
    if (required) throw new ValidationError(`${name} is required`);
    return '';
  }
  if (typeof v !== 'string') throw new ValidationError(`${name} must be a string`);
  const t = v.trim();
  if (required && !t) throw new ValidationError(`${name} is required`);
  if (t.length > max) throw new ValidationError(`${name} is too long`);
  return t;
};

const date = (v, name, { required = false } = {}) => {
  if (v === undefined || v === null || v === '') {
    if (required) throw new ValidationError(`${name} is required`);
    return null;
  }
  if (typeof v !== 'string' || !DATE_RE.test(v)) throw new ValidationError(`${name} must be YYYY-MM-DD`);
  return v;
};

const num = (v, name) => {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new ValidationError(`${name} must be a non-negative number`);
  return Math.round(n * 100) / 100;
};

const oneOf = (v, list, name, fallback) => {
  if (v === undefined || v === null) return fallback;
  if (!list.includes(v)) throw new ValidationError(`${name} must be one of ${list.join(', ')}`);
  return v;
};

export function normalizeRepeat(r) {
  if (!r) return null;
  const n = Number(r.n);
  if (!Number.isInteger(n) || n < 1 || n > 52) throw new ValidationError('repeat.n must be a whole number between 1 and 52');
  const unit = oneOf(r.unit, REPEAT_UNITS, 'repeat.unit');
  return { n, unit };
}

export function normalizeSubtask(s) {
  const repeat = normalizeRepeat(s.repeat);
  return {
    id: str(s.id, 'subtask.id', { max: 64 }) || undefined,
    title: str(s.title, 'subtask.title', { required: true, max: 300 }),
    note: str(s.note, 'subtask.note', { max: 2000 }),
    assignee: str(s.assignee, 'subtask.assignee', { max: 64 }) || null,
    due: date(s.due, 'subtask.due', { required: true }),
    done: repeat ? false : Boolean(s.done),
    repeat,
  };
}

export function normalizeLineItem(l) {
  return {
    id: str(l.id, 'lineItem.id', { max: 64 }) || undefined,
    desc: str(l.desc, 'lineItem.desc', { required: true, max: 300 }),
    cost: num(l.cost, 'lineItem.cost'),
  };
}

export function normalizeProject(body, { partial = false } = {}) {
  const out = {};
  const has = key => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has('title')) out.title = str(body.title, 'title', { required: true, max: 200 });
  if (!partial || has('description')) out.description = str(body.description, 'description', { max: 5000 });
  if (!partial || has('category')) out.category = oneOf(body.category, CATEGORIES, 'category', 'refurbish');
  if (!partial || has('status')) out.status = oneOf(body.status, STATUSES, 'status', 'planned');
  if (!partial || has('budget')) out.budget = num(body.budget, 'budget');
  if (!partial || has('start')) out.start = date(body.start, 'start', { required: true });
  if (!partial || has('end')) out.end = date(body.end, 'end', { required: true });
  if (!partial || has('prereqs')) {
    if (body.prereqs !== undefined && !Array.isArray(body.prereqs)) throw new ValidationError('prereqs must be an array of project ids');
    out.prereqs = [...new Set((body.prereqs || []).map(String))];
  }
  if (!partial || has('lineItems')) {
    if (body.lineItems !== undefined && !Array.isArray(body.lineItems)) throw new ValidationError('lineItems must be an array');
    out.lineItems = (body.lineItems || []).map(normalizeLineItem);
  }
  if (!partial || has('subtasks')) {
    if (body.subtasks !== undefined && !Array.isArray(body.subtasks)) throw new ValidationError('subtasks must be an array');
    out.subtasks = (body.subtasks || []).map(normalizeSubtask);
  }
  if (!partial || has('notes')) out.notes = str(body.notes, 'notes', { max: 20000 });

  if (out.start && out.end && out.end < out.start) {
    throw new ValidationError('end date must be on or after start date');
  }

  return out;
}

export function normalizePerson(body, { partial = false } = {}) {
  const out = {};
  const has = key => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has('name')) out.name = str(body.name, 'name', { required: true, max: 120 });
  if (!partial || has('type')) out.type = oneOf(body.type, PERSON_TYPES, 'type', 'household');
  if (!partial || has('contact')) out.contact = str(body.contact, 'contact', { max: 300 });

  return out;
}
