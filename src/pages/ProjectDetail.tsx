import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  IndianRupee,
  Radar,
  TrendingUp,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  costOverrunAmt,
  costOverrunPct,
  getProject,
  inr,
  riskCategory,
} from "../data/projects";
import { ProjectPanel, RiskChip, riskClass } from "./Projects";
import "../styles/projects.css";

function Field({
  label,
  value,
  accent = "",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="detail-field">
      <dt>{label}</dt>
      <dd className={accent} title={value}>
        {value}
      </dd>
    </div>
  );
}

export function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = getProject(projectId ?? "");
  if (!project)
    return (
      <div className="projects-page project-detail">
        <ProjectPanel className="not-found">
          <h1>Project not found</h1>
          <p>This project is not in the implementation risk register.</p>
          <button
            className="back-to-register"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft size={14} /> Back to risk register
          </button>
        </ProjectPanel>
      </div>
    );
  const category = riskCategory(project.riskScore);
  const tone = riskClass(category);
  const financialProgress = Math.round(
    (project.expenditure / project.revisedCost) * 100,
  );
  const timeline = [
    {
      label: "Original schedule",
      end: project.originalCompletion,
      months: 0,
      tone: "primary",
    },
    {
      label: "Latest revised schedule",
      end: project.revisedCompletion,
      months: Math.round(project.timeOverrunMonths * 0.65),
      tone: "high",
    },
    {
      label: "AI predicted completion",
      end: project.predictedCompletion,
      months: project.timeOverrunMonths,
      tone,
    },
  ];
  const peers = [
    { label: "This project", value: project.riskScore, tone },
    {
      label: "Sector median",
      value: project.sectorMedianScore,
      tone: "primary",
    },
    { label: "Best in sector", value: project.sectorBestScore, tone: "low" },
  ];
  const maxMonths = project.timeOverrunMonths || 1;
  const chartGradient = `cost-fill-${project.id}`;
  return (
    <div className="projects-page project-detail">
      <button
        className="back-to-register"
        onClick={() => navigate("/projects")}
      >
        <ArrowLeft size={14} /> Back to risk register
      </button>
      <section className="detail-hero">
        <div className="detail-hero-inner">
          <div>
            <p className="projects-eyebrow">Project Intelligence</p>
            <h1>{project.name}</h1>
            <p className="detail-meta">
              {project.code} · {project.sector} · {project.agency}
            </p>
          </div>
          <div className="detail-score">
            <div>
              <p className="detail-score-label">Implementation risk score</p>
              <p className={`detail-score-value ${tone}`}>
                {project.riskScore}
                <small>/100</small>
              </p>
            </div>
            <div
              className="score-ring"
              style={{
                background: `conic-gradient(var(--p-${tone}) 0 ${project.riskScore}%, var(--p-muted) ${project.riskScore}% 100%)`,
              }}
            >
              <div>
                <RiskChip level={category} className="compact-chip" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="detail-grid">
        <ProjectPanel title="Project Information" className="information">
          <dl className="detail-fields">
            <Field label="Project name" value={project.name} />
            <Field label="Project code" value={project.code} />
            <Field label="Sector" value={project.sector} />
            <Field
              label="Line ministry / department"
              value={project.ministry}
            />
            <Field label="Implementing agency" value={project.agency} />
          </dl>
        </ProjectPanel>
        <ProjectPanel
          title="Cost Intelligence"
          subtitle="₹ crore"
          className="span-two"
          action={<IndianRupee size={16} color="var(--p-muted-foreground)" />}
        >
          <dl className="detail-fields">
            <Field
              label="Original approved cost"
              value={inr(project.approvedCost)}
            />
            <Field
              label="Latest revised cost"
              value={inr(project.revisedCost)}
            />
            <Field
              label="Cumulative expenditure"
              value={inr(project.expenditure)}
            />
            <Field
              label="Predicted final cost"
              value={inr(project.predictedFinalCost)}
              accent={tone}
            />
            <Field
              label="Predicted cost overrun"
              value={`${inr(costOverrunAmt(project))} (+${costOverrunPct(project).toFixed(1)}%)`}
              accent={tone}
            />
          </dl>
          <div className="detail-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={project.costSeries}
                margin={{ left: 8, right: 8, top: 8 }}
              >
                <defs>
                  <linearGradient
                    id={chartGradient}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--p-primary)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--p-primary)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--p-border)" vertical={false} />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11 }}
                  stroke="var(--p-muted-foreground)"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="var(--p-muted-foreground)"
                  width={54}
                />
                <Tooltip
                  formatter={(value) => [inr(Number(value ?? 0)), "Cost"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--p-border)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--p-primary)"
                  strokeWidth={2}
                  fill={`url(#${chartGradient})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ProjectPanel>
      </div>
      <div className="detail-grid">
        <ProjectPanel
          title="Timeline Intelligence"
          className="span-two"
          action={<Clock size={16} color="var(--p-muted-foreground)" />}
        >
          <dl className="detail-fields">
            <Field label="Project start" value={project.startDate} />
            <Field
              label="Original completion"
              value={project.originalCompletion}
            />
            <Field
              label="Latest revised completion"
              value={project.revisedCompletion}
            />
            <Field
              label="AI predicted completion"
              value={project.predictedCompletion}
              accent={tone}
            />
            <Field
              label="Predicted time overrun"
              value={`${project.timeOverrunMonths} months`}
              accent={tone}
            />
          </dl>
          <div className="timeline-list">
            {timeline.map((row) => (
              <div key={row.label}>
                <div className="timeline-title">
                  <span>{row.label}</span>
                  <span>
                    {row.end}
                    {row.months > 0 && ` · +${row.months} mo`}
                  </span>
                </div>
                <div className="timeline-track">
                  <span
                    className={`tone-${row.tone}`}
                    style={{ width: `${45 + (row.months / maxMonths) * 55}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ProjectPanel>
        <ProjectPanel
          title="Progress & Risk"
          action={<TrendingUp size={16} color="var(--p-muted-foreground)" />}
        >
          <div className="progress-content">
            <div>
              <div className="progress-label">
                <span>Physical progress</span>
                <b>{project.physicalProgress}%</b>
              </div>
              <div className="progress-track">
                <span
                  className="tone-primary"
                  style={{ width: `${project.physicalProgress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="progress-label">
                <span>Financial progress</span>
                <b>{financialProgress}%</b>
              </div>
              <div className="progress-track">
                <span
                  className="tone-financial"
                  style={{ width: `${financialProgress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="progress-label">
                <span>Implementation risk score</span>
                <b className={tone}>{project.riskScore}/100</b>
              </div>
              <div className="progress-track">
                <span
                  className={`tone-${tone}`}
                  style={{ width: `${project.riskScore}%` }}
                />
              </div>
            </div>
            <p className="progress-note">
              Physical progress trails financial progress by{" "}
              <b>
                {Math.max(0, financialProgress - project.physicalProgress)}{" "}
                points
              </b>
              , a standard leading indicator of cost overrun in this sector.
            </p>
          </div>
        </ProjectPanel>
      </div>
      <ProjectPanel className="why-risk">
        <header className="why-risk-header">
          <AlertTriangle size={20} className={tone} />
          <div>
            <h2>Why is this project at risk?</h2>
            <p>
              AI risk intelligence · attribution model v3.4 · reviewed against{" "}
              {project.sector} sector baseline
            </p>
          </div>
        </header>
        <div className="risk-why-grid">
          <section className="risk-why-section">
            <h3>Top contributing factors</h3>
            <ol className="factor-list">
              {project.factors.map((factor, index) => (
                <li key={factor.label}>
                  <div className="factor-top">
                    <span>
                      <b className="factor-index">
                        {String(index + 1).padStart(2, "0")}
                      </b>{" "}
                      {factor.label}
                    </span>
                    <span className="factor-weight">{factor.weight}%</span>
                  </div>
                  <div className="factor-track">
                    <span
                      className={`tone-${tone}`}
                      style={{ width: `${factor.weight}%` }}
                    />
                  </div>
                  <p>{factor.detail}</p>
                </li>
              ))}
            </ol>
          </section>
          <div className="stacked-section">
            <section className="risk-why-section">
              <h3>Possible reasons for cost escalation</h3>
              <ul className="reason-list cost">
                {project.costReasons.map((reason) => (
                  <li key={reason}>
                    <IndianRupee size={14} />
                    {reason}
                  </li>
                ))}
              </ul>
            </section>
            <section className="risk-why-section">
              <h3>Possible reasons for time delay</h3>
              <ul className="reason-list time">
                {project.timeReasons.map((reason) => (
                  <li key={reason}>
                    <Clock size={14} />
                    {reason}
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section className="risk-why-section">
            <h3>Early warning signals</h3>
            <ul className="warning-list">
              {project.earlyWarnings.map((warning) => (
                <li key={warning.text}>
                  <span className={`warning-dot ${riskClass(warning.level)}`} />
                  {warning.text}
                </li>
              ))}
            </ul>
          </section>
          <section className="risk-why-section">
            <div className="factor-top">
              <h3>Compared with similar {project.sector} projects</h3>
              <Radar size={16} color="var(--p-muted-foreground)" />
            </div>
            <div className="peer-list">
              {peers.map((peer) => (
                <div className="peer-row" key={peer.label}>
                  <span className="peer-label">{peer.label}</span>
                  <div className="peer-track">
                    <span
                      className={`tone-${peer.tone}`}
                      style={{ width: `${peer.value}%` }}
                    />
                  </div>
                  <b className="peer-score">{peer.value}</b>
                </div>
              ))}
            </div>
            <p className="recommendation">
              <b>Recommended action: </b>this project sits{" "}
              {project.riskScore - project.sectorMedianScore} points above the{" "}
              {project.sector} median. Escalate to the line ministry review
              committee, freeze further scope additions, and require a
              fortnightly recovery plan against the top two contributing
              factors.
            </p>
          </section>
        </div>
      </ProjectPanel>
    </div>
  );
}
