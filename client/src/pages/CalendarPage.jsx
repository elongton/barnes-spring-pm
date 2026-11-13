import { useState } from 'react';
import { useStore } from '../store.jsx';
import { MonthGrid } from '../components/MonthGrid.jsx';
import { Timeline } from '../components/Timeline.jsx';
import { today } from '../lib/dates.js';

export function CalendarPage() {
  const { projects } = useStore();
  const t = today();
  const [mode, setMode] = useState('month');
  const [ym, setYm] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const label = new Date(ym.y, ym.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shift = n => { const dt = new Date(ym.y, ym.m + n, 1); setYm({ y: dt.getFullYear(), m: dt.getMonth() }); };

  return (
    <>
      <div className="page-head">
        <div><h1>Calendar</h1><p>Every project as a span from start date to end date. Maintenance subtasks appear on their day.</p></div>
        <div className="seg">
          <button className={mode === 'month' ? 'on' : ''} onClick={() => setMode('month')}>Month</button>
          <button className={mode === 'timeline' ? 'on' : ''} onClick={() => setMode('timeline')}>Timeline</button>
        </div>
      </div>
      {mode === 'month' ? (
        <>
          <div className="cal-head">
            <div className="cal-nav">
              <button className="btn sm" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
              <h2>{label}</h2>
              <button className="btn sm" onClick={() => shift(1)} aria-label="Next month">›</button>
              <button className="btn sm ghost" onClick={() => setYm({ y: t.getFullYear(), m: t.getMonth() })}>Today</button>
            </div>
          </div>
          <MonthGrid year={ym.y} month={ym.m} projects={projects} />
        </>
      ) : <Timeline projects={projects} />}
    </>
  );
}
