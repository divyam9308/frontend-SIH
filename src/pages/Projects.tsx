import { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { costOverrunAmt, costOverrunPct, inr, projects, riskCategory, type RiskCategory } from '../data/projects';
import '../styles/projects.css';

type SortKey = 'name' | 'code' | 'sector' | 'cost' | 'time' | 'score';
const categories: RiskCategory[] = ['Critical', 'High', 'Medium', 'Low'];
const descriptions: Record<RiskCategory, string> = { Critical: 'Immediate intervention', High: 'Escalating exposure', Medium: 'Active monitoring', Low: 'Broadly on track' };
const PAGE_SIZE = 10;
export const riskClass = (risk: RiskCategory) => risk.toLowerCase();

export function RiskChip({ level, className = '' }: { level: RiskCategory; className?: string }) {
  return <span className={`project-risk-chip ${riskClass(level)} ${className}`}><span />{level}</span>;
}

export function ProjectPanel({ title, subtitle, action, children, className = '' }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`project-panel ${className}`}>{title && <header className="project-panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>}{children}</section>;
}

export function Projects() {
  const navigate = useNavigate();
  const [active, setActive] = useState<RiskCategory | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'score', dir: -1 });
  const stats = useMemo(() => categories.map((category) => {
    const list = projects.filter((project) => riskCategory(project.riskScore) === category);
    return { category, count: list.length, exposure: list.reduce((sum, project) => sum + costOverrunAmt(project), 0) };
  }), []);
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const getValue = (project: (typeof projects)[number]) => {
      if (sort.key === 'name') return project.name.toLowerCase();
      if (sort.key === 'code') return project.code.toLowerCase();
      if (sort.key === 'sector') return project.sector.toLowerCase();
      if (sort.key === 'cost') return costOverrunPct(project);
      if (sort.key === 'time') return project.timeOverrunMonths;
      return project.riskScore;
    };
    return projects.filter((project) => (!active || riskCategory(project.riskScore) === active) && (!term || project.name.toLowerCase().includes(term) || project.code.toLowerCase().includes(term) || project.sector.toLowerCase().includes(term))).sort((a, b) => (getValue(a) > getValue(b) ? 1 : getValue(a) < getValue(b) ? -1 : 0) * sort.dir);
  }, [active, query, sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const resetPage = () => setPage(1);
  const toggleSort = (key: SortKey) => setSort((previous) => previous.key === key ? { key, dir: previous.dir === 1 ? -1 : 1 } : { key, dir: ['name', 'code', 'sector'].includes(key) ? 1 : -1 });
  const header = (key: SortKey, label: string, align = '') => <th className={align}><button onClick={() => toggleSort(key)} className={sort.key === key ? 'is-sorted' : ''}>{label}<ArrowUpDown size={13} /></button></th>;
  const totalExposure = projects.reduce((sum, project) => sum + costOverrunAmt(project), 0);

  return <div className="projects-page">
    <div className="projects-heading">
      <div><p className="projects-eyebrow">Projects</p><h1>Implementation Risk Register</h1><p className="projects-summary">{projects.length} monitored projects · 11 sectors · predictions refreshed 04:00 IST</p></div>
      <div className="portfolio-card"><p>Portfolio cost at risk</p><strong>{inr(totalExposure)}</strong></div>
    </div>
    <div className="risk-card-grid">{stats.map((stat) => { const selected = active === stat.category; return <button key={stat.category} aria-pressed={selected} className={`risk-card ${riskClass(stat.category)} ${selected ? 'is-active' : ''}`} onClick={() => { setActive(selected ? null : stat.category); resetPage(); }}><div><b>{stat.category}</b><i /></div><strong>{String(stat.count).padStart(2, '0')}</strong><p>{descriptions[stat.category]}</p><div className="risk-progress"><span style={{ width: `${(stat.count / projects.length) * 100}%` }} /></div><small>{inr(stat.exposure)} predicted overrun</small></button>; })}</div>
    <ProjectPanel title="Projects" subtitle={active ? `Filtered to ${active} risk · ${rows.length} project${rows.length === 1 ? '' : 's'}` : `All risk levels · ${rows.length} projects`} className="projects-register" action={<div className="register-actions">{active && <button className="clear-filter" onClick={() => { setActive(null); resetPage(); }}>Clear filter</button>}<label className="project-search"><Search size={14} /><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Search name, code, sector…" aria-label="Search projects" /></label></div>}>
      <div className="project-table-wrap"><table className="project-table"><thead><tr>{header('name', 'Project Name')}{header('code', 'Project Code')}{header('sector', 'Sector')}{header('score', 'Risk Score', 'numeric')}{header('cost', 'Predicted Cost Overrun', 'numeric')}{header('time', 'Predicted Time Overrun', 'numeric')}<th>Risk Category</th></tr></thead><tbody>{pageRows.map((project) => { const category = riskCategory(project.riskScore); return <tr key={project.id} tabIndex={0} role="link" aria-label={`Open ${project.name} project intelligence`} onClick={() => navigate(`/projects/${project.id}`)} onKeyDown={(event) => { if (event.key === 'Enter') navigate(`/projects/${project.id}`); }}><td><div className="project-name"><span className={`risk-marker ${riskClass(category)}`} />{project.name}</div></td><td className="project-code">{project.code}</td><td className="project-sector">{project.sector}</td><td className="numeric"><b>{project.riskScore}</b><small>/100</small></td><td className="numeric project-overrun"><b className={riskClass(category)}>+{costOverrunPct(project).toFixed(1)}%</b><small>{inr(costOverrunAmt(project))}</small></td><td className="numeric project-overrun"><b className={riskClass(category)}>+{project.timeOverrunMonths} mo</b><small>{project.physicalProgress}% physical</small></td><td><div className="project-category"><RiskChip level={category} /><ChevronRight size={16} /></div></td></tr>; })}{pageRows.length === 0 && <tr><td className="project-empty" colSpan={7}>No projects match this filter.</td></tr>}</tbody></table></div>
      <div className="project-pagination"><p>Showing <b>{rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)}</b> of <b>{rows.length}</b> projects</p><div><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Previous page"><ChevronLeft size={16} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => <button key={value} onClick={() => setPage(value)} aria-current={value === currentPage ? 'page' : undefined} className={value === currentPage ? 'is-current' : ''}>{value}</button>)}<button onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} aria-label="Next page"><ChevronRight size={16} /></button></div></div>
    </ProjectPanel>
  </div>;
}
