// Generates a real text-based (ATS-readable) PDF with jsPDF — not a screenshot image.
import { jsPDF } from 'jspdf';

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const SECTION_TITLES = { summary: 'Professional Summary', education: 'Education', skills: 'Technical Skills', experience: 'Experience', internships: 'Internships', projects: 'Projects', certifications: 'Certifications', achievements: 'Achievements' };
export const lines = (s) => String(s || '').split('\n').map((x) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

export function hasContent(data, key) {
  if (key === 'summary') return Boolean(data.personal?.summary?.trim());
  if (key === 'skills') return Object.values(data.skills || {}).some((v) => String(v).trim());
  return Array.isArray(data[key]) && data[key].some((x) => Object.values(x).some((v) => String(v || '').trim()));
}

export function downloadResumePdf(data, template, fileName = 'resume.pdf') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 16, maxW = W - 2 * M;
  const accent = hexToRgb(template.accent || '#1e293b');
  let y = 18;
  const ensure = (h) => { if (y + h > 285) { doc.addPage(); y = 18; } };
  const text = (str, { size = 10, bold = false, color = [17, 24, 39], indent = 0, gap = 1.6 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(String(str), maxW - indent);
    wrapped.forEach((l) => { ensure(size * 0.45); doc.text(l, M + indent, y); y += size * 0.42 + gap * 0.5; });
  };
  const bullet = (str) => { ensure(5); doc.setFontSize(10); doc.setTextColor(17, 24, 39); doc.text('•', M + 1, y); const before = y; text(str, { indent: 5 }); if (y === before) y += 4; };

  const p = data.personal || {};
  text(p.name || 'Your Name', { size: 18, bold: true, color: accent, gap: 3 });
  const contact = [p.email, p.phone, p.location].filter(Boolean).join('  |  ');
  if (contact) text(contact, { size: 9, color: [75, 85, 99] });
  const links = [p.linkedin, p.github, p.portfolio].filter(Boolean).join('  |  ');
  if (links) text(links, { size: 9, color: [75, 85, 99] });
  y += 2;

  (template.section_order || []).forEach((key) => {
    if (!hasContent(data, key)) return;
    ensure(12);
    y += 2;
    text(SECTION_TITLES[key].toUpperCase(), { size: 10.5, bold: true, color: accent });
    doc.setDrawColor(...accent); doc.setLineWidth(0.4); doc.line(M, y - 2.2, W - M, y - 2.2); y += 1.5;
    if (key === 'summary') text(p.summary);
    if (key === 'skills') {
      const s = data.skills;
      [['Languages', s.languages], ['Frameworks & Libraries', s.frameworks], ['Tools & Platforms', s.tools], ['Core Concepts', s.concepts]].forEach(([l, v]) => { if (v && v.trim()) text(`${l}: ${v}`); });
    }
    if (key === 'education') data.education.forEach((e) => { text(`${e.degree || ''}${e.institution ? ' — ' + e.institution : ''}`, { bold: true }); const meta = [e.year, e.score].filter(Boolean).join('  |  '); if (meta) text(meta, { size: 9, color: [75, 85, 99] }); y += 1; });
    if (key === 'experience' || key === 'internships') data[key].forEach((e) => { text(`${e.role || ''}${e.company ? ' — ' + e.company : ''}`, { bold: true }); if (e.duration) text(e.duration, { size: 9, color: [75, 85, 99] }); lines(e.description).forEach(bullet); y += 1; });
    if (key === 'projects') data.projects.forEach((pr) => { text(`${pr.name || ''}${pr.tech ? ' | ' + pr.tech : ''}`, { bold: true }); if (pr.link) text(pr.link, { size: 9, color: [75, 85, 99] }); lines(pr.description).forEach(bullet); y += 1; });
    if (key === 'certifications') data.certifications.forEach((c) => bullet([c.name, c.issuer, c.year].filter(Boolean).join(' — ')));
    if (key === 'achievements') data.achievements.forEach((a) => a.text && bullet(a.text));
  });
  doc.save(fileName);
}
