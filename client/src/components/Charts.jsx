// Chart.js wrappers. Every chart is drawn from real data returned by the API.
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale, Filler, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale, Filler, Tooltip, Legend);
ChartJS.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
ChartJS.defaults.color = '#64748b';

const COLORS = { indigo: '#4f46e5', violet: '#7c3aed', teal: '#0d9488', amber: '#d97706', grid: '#eef1f7' };
const baseOpts = (extra = {}) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0b1437', padding: 10, cornerRadius: 8 } },
  scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: COLORS.grid }, ticks: { precision: 0 } } },
  ...extra,
});
const shortDay = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' });
const shortDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function StudyBar({ series, label = 'Study minutes', key = 'minutes', weekday = true, color = COLORS.indigo }) {
  return (
    <div className="chart-box">
      <Bar data={{ labels: series.map((d) => (weekday ? shortDay(d.date) : shortDate(d.date))), datasets: [{ label, data: series.map((d) => d[key]), backgroundColor: color, borderRadius: 6, maxBarThickness: 28 }] }} options={baseOpts()} />
    </div>
  );
}

export function TrendLine({ series, keys, tall }) {
  const palette = [COLORS.indigo, COLORS.teal, COLORS.violet, COLORS.amber];
  return (
    <div className={`chart-box ${tall ? 'tall' : ''}`}>
      <Line
        data={{ labels: series.map((d) => shortDate(d.date)), datasets: keys.map(([k, label], i) => ({ label, data: series.map((d) => d[k]), borderColor: palette[i], backgroundColor: palette[i] + '22', fill: i === 0, tension: 0.35, pointRadius: 2 })) }}
        options={baseOpts({ plugins: { legend: { display: keys.length > 1, position: 'bottom', labels: { boxWidth: 10 } } } })}
      />
    </div>
  );
}

export function MonthlyBars({ months }) {
  return (
    <div className="chart-box">
      <Bar
        data={{ labels: months.map((m) => new Date(m.month + '-01T00:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' })), datasets: [
          { label: 'Study hours', data: months.map((m) => Math.round((m.minutes / 60) * 10) / 10), backgroundColor: COLORS.indigo, borderRadius: 6 },
          { label: 'Problems solved', data: months.map((m) => m.coding), backgroundColor: COLORS.teal, borderRadius: 6 },
        ] }}
        options={baseOpts({ plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10 } } } })}
      />
    </div>
  );
}

export function SkillRadar({ skills }) {
  return (
    <div className="chart-box tall">
      <Radar
        data={{ labels: skills.map((s) => s.skill), datasets: [{ label: 'Skill %', data: skills.map((s) => s.value), backgroundColor: 'rgba(124,58,237,0.18)', borderColor: COLORS.violet, pointBackgroundColor: COLORS.violet }] }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, display: false }, grid: { color: COLORS.grid }, angleLines: { color: COLORS.grid } } } }}
      />
    </div>
  );
}

export function HBar({ labels, values, max = 100, suffix = '%', color = COLORS.teal }) {
  return (
    <div className="chart-box" style={{ height: Math.max(160, labels.length * 34) }}>
      <Bar data={{ labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 6, maxBarThickness: 20 }] }}
        options={baseOpts({ indexAxis: 'y', scales: { x: { min: 0, max, grid: { color: COLORS.grid }, ticks: { callback: (v) => v + suffix } }, y: { grid: { display: false } } } })} />
    </div>
  );
}

export function Breakdown({ breakdown }) {
  const entries = Object.entries(breakdown);
  return (
    <div className="chart-box">
      <Doughnut
        data={{ labels: entries.map(([k]) => k[0].toUpperCase() + k.slice(1)), datasets: [{ data: entries.map(([, v]) => v.score), backgroundColor: ['#4f46e5', '#0d9488', '#7c3aed', '#2dd4bf', '#d97706', '#6366f1', '#94a3b8'], borderWidth: 0 }] }}
        options={{ responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } } }}
      />
    </div>
  );
}
