import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  confusionMatrix,
  defaultConfig,
  evaluationOptions,
  expandingWindow,
  histogram,
  matrixMetrics,
  riskLabels,
  shapFeatures,
  shiftEvidence,
  type EvaluationConfig,
  type PredictionEvidence,
  type RiskLevel,
} from "../data/predictionAccuracy";
import "../styles/predictionAccuracy.css";

const blue = "#2563eb";
const orange = "#f97316";
const riskClass = (level: RiskLevel) => level.toLowerCase();
const metric = matrixMetrics();

function Panel({
  title,
  children,
  className = "",
  action,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`pa-panel ${className}`}>
      <header>
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
function RiskChip({ level }: { level: RiskLevel }) {
  return (
    <span className={`pa-chip ${riskClass(level)}`}>
      <i />
      {level}
    </span>
  );
}
function SummaryCard({
  icon,
  title,
  footer,
  children,
  accent = "blue",
}: {
  icon: ReactNode;
  title: string;
  footer: string;
  children: ReactNode;
  accent?: "blue" | "orange";
}) {
  return (
    <article className="pa-summary-card">
      <div className={`pa-summary-icon ${accent}`}>{icon}</div>
      <div>
        <h3>{title}</h3>
        <div className="pa-summary-values">{children}</div>
        <p>{footer}</p>
      </div>
    </article>
  );
}
function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ScatterPanel({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: PredictionEvidence[];
  kind: "cost" | "delay";
}) {
  const cost = kind === "cost";
  const domain: [number, number] = cost ? [-20, 100] : [-200, 1000];
  const points = rows.map((row) => ({
    ...row,
    actual: cost ? row.actualCostOverrun : row.actualDelay,
    predicted: cost ? row.predictedCostOverrun : row.predictedDelay,
  }));
  return (
    <Panel title={title} className="pa-chart-panel">
      <div className="pa-chart scatter-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 12, bottom: 18, left: 4 }}>
            <CartesianGrid stroke="#e3eaf3" />
            <XAxis
              dataKey="actual"
              type="number"
              domain={domain}
              tick={{ fontSize: 9, fill: "#64748b" }}
              label={{
                value: cost ? "Actual Overrun (%)" : "Actual Delay (Days)",
                position: "insideBottom",
                offset: -10,
                fontSize: 9,
                fill: "#64748b",
              }}
            />
            <YAxis
              dataKey="predicted"
              type="number"
              domain={domain}
              tick={{ fontSize: 9, fill: "#64748b" }}
              label={{
                value: cost
                  ? "Predicted Overrun (%)"
                  : "Predicted Delay (Days)",
                angle: -90,
                position: "insideLeft",
                fontSize: 9,
                fill: "#64748b",
              }}
            />
            <ReferenceLine
              segment={[
                { x: domain[0], y: domain[0] },
                { x: domain[1], y: domain[1] },
              ]}
              stroke="#94a3b8"
              strokeDasharray="4 3"
            />
            <Tooltip
              content={(props) => {
                const point = props.payload?.[0]?.payload as
                  | (typeof points)[number]
                  | undefined;
                if (!props.active || !point) return null;
                const error = point.predicted - point.actual;
                return (
                  <div className="pa-tooltip">
                    <b>{point.name}</b>
                    <span>{point.id}</span>
                    <p>
                      Actual: {point.actual}
                      {cost ? "%" : " days"}
                    </p>
                    <p>
                      Predicted: {point.predicted}
                      {cost ? "%" : " days"}
                    </p>
                    <p>
                      Error: {error >= 0 ? "+" : ""}
                      {error.toFixed(cost ? 1 : 0)}
                      {cost ? " pp" : " days"}
                    </p>
                  </div>
                );
              }}
            />
            <Scatter data={points} fill={cost ? blue : orange} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function Distribution({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: PredictionEvidence[];
  kind: "cost" | "delay";
}) {
  const data = histogram(rows, kind);
  return (
    <Panel title={title} className="pa-chart-panel pa-small-chart">
      <div className="pa-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barCategoryGap={2}
            margin={{ top: 12, right: 6, bottom: 0, left: -20 }}
          >
            <CartesianGrid stroke="#e3eaf3" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: "#64748b" }} />
            <YAxis
              tick={{ fontSize: 9, fill: "#64748b" }}
              allowDecimals={false}
            />
            <Tooltip formatter={(value) => [value, "Projects"]} />
            <Bar
              dataKey="frequency"
              fill={kind === "cost" ? blue : orange}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function TrainingModal({
  close,
  config,
}: {
  close: () => void;
  config: EvaluationConfig;
}) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [close]);
  return (
    <div className="pa-modal-backdrop" role="presentation" onMouseDown={close}>
      <section
        className="pa-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p>PAIMANA methodology</p>
            <h2 id="training-title">How is Model Trained?</h2>
          </div>
          <button onClick={close} aria-label="Close training methodology">
            <X size={18} />
          </button>
        </header>
        <div className="pa-modal-body">
          <dl>
            <div>
              <dt>Training dataset</dt>
              <dd>
                Completed public infrastructure projects with sanctioned cost,
                schedule, execution and risk records.
              </dd>
            </div>
            <div>
              <dt>Training period</dt>
              <dd>
                {config.trainingPeriod}; records are truncated at each
                historical prediction point.
              </dd>
            </div>
            <div>
              <dt>Holdout period</dt>
              <dd>
                {config.holdoutPeriod}; excluded from fitting and reserved for
                evaluation.
              </dd>
            </div>
            <div>
              <dt>Evaluation strategy</dt>
              <dd>
                {config.method} validation preserves temporal order and prevents
                future-data leakage.
              </dd>
            </div>
            <div>
              <dt>Target variables</dt>
              <dd>
                Final cost overrun, completion delay, and four-level
                implementation risk.
              </dd>
            </div>
            <div>
              <dt>Feature engineering</dt>
              <dd>
                Physical and financial progress, prior variance, procurement,
                inflation, approvals and sector context.
              </dd>
            </div>
            <div>
              <dt>Prediction methodology</dt>
              <dd>
                Cost and delay models estimate continuous outcomes; the
                classifier converts leading signals into risk bands.
              </dd>
            </div>
            <div>
              <dt>Validation & limitations</dt>
              <dd>
                MAE, MAPE, R² and macro F1 are monitored. Estimates support
                review, not replacement of project-manager judgement.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

export function PredictionAccuracyPage() {
  const [config, setConfig] = useState<EvaluationConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const rows = useMemo(() => shiftEvidence(config), [config]);
  const offset =
    config.rule === defaultConfig.rule && config.method === defaultConfig.method
      ? 0
      : 0.35;
  const setField = <K extends keyof EvaluationConfig>(
    key: K,
    value: EvaluationConfig[K],
  ) => setConfig((previous) => ({ ...previous, [key]: value }));
  const refresh = () => {
    setLoading(true);
    setConfig((previous) => ({ ...previous, status: "running" }));
    window.setTimeout(() => {
      setConfig((previous) => ({ ...previous, status: "complete" }));
      setLoading(false);
    }, 700);
  };
  return (
    <div className="prediction-accuracy-page">
      <div className="pa-product-header">
        <div>
          <BarChart3 size={17} />
          <b>PAIMANA</b>
          <span>MoSPI · Project Risk Intelligence</span>
        </div>
        <div>
          <span className="pa-live">
            <i />
            Live · model v3.4
          </span>
          <em>SIH 26103</em>
        </div>
      </div>
      <main className="pa-content">
        <div className="pa-page-heading">
          <div>
            <h1>Prediction Accuracy</h1>
            <p>
              Historical vs real-time evaluation of cost, schedule and progress
              risk predictions.
            </p>
          </div>
          <div className="pa-heading-actions">
            <span className="pa-validated">
              <CheckCircle2 size={14} />
              Validated on complete projects
            </span>
            <span>Snapshot: 27 Aug 2024</span>
            <button className="pa-refresh" onClick={refresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              {loading ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>
        <section className="pa-config">
          <label>
            Evaluation Rule
            <select
              value={config.rule}
              onChange={(event) => setField("rule", event.target.value)}
            >
              {evaluationOptions.rules.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Training Period
            <select
              value={config.trainingPeriod}
              onChange={(event) =>
                setField("trainingPeriod", event.target.value)
              }
            >
              {evaluationOptions.training.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Holdout Period
            <select
              value={config.holdoutPeriod}
              onChange={(event) =>
                setField("holdoutPeriod", event.target.value)
              }
            >
              {evaluationOptions.holdout.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Evaluation
            <select
              value={config.method}
              onChange={(event) => setField("method", event.target.value)}
            >
              {evaluationOptions.methods.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="pa-status">
            <span>Status</span>
            <b>
              <i />
              {config.status === "running" ? "Running" : "Complete"}
            </b>
          </div>
          <button
            className="pa-training-button"
            onClick={() => setShowTraining(true)}
          >
            <BookOpen size={15} />
            How is Model Trained?
          </button>
        </section>
        <section className="pa-section">
          <h2>Validation Summary</h2>
          <div className="pa-summary-grid">
            <SummaryCard
              title="Cost Prediction"
              icon={<TrendingUp size={16} />}
              footer="Lower is better"
            >
              <Value label="MAE" value={`${(8.41 + offset).toFixed(2)}%`} />
              <Value label="MAPE" value="9.87%" />
              <Value label="R²" value="0.87" />
            </SummaryCard>
            <SummaryCard
              title="Delay Prediction"
              icon={<CalendarDays size={16} />}
              footer="Lower is better"
            >
              <Value label="MAE" value="47.6 days" />
              <Value label="MAPE" value="72.3 days" />
              <Value label="R²" value="0.61" />
            </SummaryCard>
            <SummaryCard
              title="Risk Classification"
              icon={<AlertTriangle size={16} />}
              accent="orange"
              footer="Higher is better"
            >
              <Value label="F1" value="0.72" />
              <Value label="Precision" value="0.74" />
              <Value label="Recall" value="0.71" />
            </SummaryCard>
            <SummaryCard
              title="Temporal Stability"
              icon={<Clock3 size={16} />}
              footer="Exceeding Threshold"
            >
              <Value label="Windows" value="5" />
              <Value label="Funds" value="5" />
            </SummaryCard>
            <SummaryCard
              title="Early-warning Evidence"
              icon={<Bell size={16} />}
              accent="orange"
              footer="Higher is better"
            >
              <Value label="Material Lead Time" value="4.8 months" />
              <Value label="Projects Detected Early" value="78%" />
            </SummaryCard>
          </div>
        </section>
        <section className="pa-analytics-row-one">
          <ScatterPanel
            title="Predicted vs Actual Cost Overrun (%)"
            rows={rows}
            kind="cost"
          />
          <ScatterPanel
            title="Predicted vs Actual Delay (Days)"
            rows={rows}
            kind="delay"
          />
          <Panel
            title="Risk Classification – Confusion Matrix"
            className="pa-matrix"
          >
            <div className="pa-matrix-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Actual / Predicted</th>
                    {riskLabels.map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {confusionMatrix.map((row, rowIndex) => (
                    <tr key={row.actual}>
                      <th scope="row">{row.actual}</th>
                      {row.values.map((value, columnIndex) => (
                        <td
                          key={columnIndex}
                          title={`Actual ${row.actual} → Predicted ${riskLabels[columnIndex]}: ${value} projects`}
                          className={
                            rowIndex === columnIndex
                              ? "correct"
                              : value > 100
                                ? "significant"
                                : ""
                          }
                        >
                          {value}
                        </td>
                      ))}
                      <td className="total">
                        {row.values
                          .reduce((sum, value) => sum + value, 0)
                          .toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer>
              Accuracy: <b>{metric.accuracy.toFixed(2)}</b>
              <span />
              Macro F1: <b>{metric.macroF1.toFixed(2)}</b>
            </footer>
          </Panel>
        </section>
        <section className="pa-analytics-row-two">
          <Panel
            title="Expanding Window Validation (MAE)"
            className="pa-window"
          >
            <div className="pa-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={expandingWindow}
                  margin={{ top: 12, right: 10, bottom: 0, left: -12 }}
                >
                  <CartesianGrid stroke="#e3eaf3" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                  />
                  <YAxis
                    yAxisId="cost"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                  />
                  <YAxis
                    yAxisId="delay"
                    orientation="right"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Line
                    yAxisId="cost"
                    type="monotone"
                    dataKey="cost"
                    name="Cost MAE"
                    stroke={blue}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="delay"
                    type="monotone"
                    dataKey="delay"
                    name="Delay MAE (Days)"
                    stroke={orange}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Distribution
            title="Cost Error Distribution (%)"
            rows={rows}
            kind="cost"
          />
          <Distribution
            title="Delay Error Distribution (Days)"
            rows={rows}
            kind="delay"
          />
          <Panel title="Top 5 Important Features (SHAP)" className="pa-shap">
            <div className="pa-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shapFeatures}
                  layout="vertical"
                  margin={{ top: 6, right: 26, bottom: 8, left: 18 }}
                >
                  <CartesianGrid stroke="#e3eaf3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                    label={{
                      value: "Mean |SHAP| Value",
                      position: "insideBottom",
                      offset: -4,
                      fontSize: 9,
                      fill: "#64748b",
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    width={104}
                    tick={{ fontSize: 9, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Importance"]}
                    labelFormatter={(label) =>
                      shapFeatures.find((item) => item.feature === label)
                        ?.interpretation ?? String(label)
                    }
                  />
                  <Bar dataKey="value" fill={blue} radius={[0, 2, 2, 0]}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(value) => Number(value ?? 0).toFixed(2)}
                      fontSize={9}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </section>
        <Panel title="Project-wise Prediction Evidence" className="pa-evidence">
          <div className="pa-table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    "Project ID",
                    "Project Name",
                    "Sector",
                    "Actual Cost Overrun (%)",
                    "Predicted Cost Overrun (%)",
                    "Cost Error (%)",
                    "Actual Delay (Days)",
                    "Predicted Delay (Days)",
                    "Delay Error (Days)",
                    "Risk Category",
                    "Early Warning",
                    "Confidence (pts)",
                  ].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((project) => {
                  const costError =
                    project.predictedCostOverrun - project.actualCostOverrun;
                  const delayError =
                    project.predictedDelay - project.actualDelay;
                  return (
                    <tr key={project.id}>
                      <td className="mono">{project.id}</td>
                      <td>
                        <b>{project.name}</b>
                      </td>
                      <td>{project.sector}</td>
                      <td>{project.actualCostOverrun.toFixed(1)}%</td>
                      <td>{project.predictedCostOverrun.toFixed(1)}%</td>
                      <td className={costError > 0 ? "error-positive" : ""}>
                        {costError >= 0 ? "+" : ""}
                        {costError.toFixed(1)}%
                      </td>
                      <td>{project.actualDelay}</td>
                      <td>{project.predictedDelay}</td>
                      <td className={delayError > 0 ? "error-positive" : ""}>
                        {delayError >= 0 ? "+" : ""}
                        {delayError}
                      </td>
                      <td>
                        <RiskChip level={project.actualRisk} />
                      </td>
                      <td>
                        <RiskChip level={project.earlyWarning} />
                      </td>
                      <td className="mono">{project.confidence}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        <p className="pa-note">
          <Info size={13} />
          Evaluation metrics are calculated on historical project outcomes;
          current selections recompute the displayed prediction evidence.
        </p>
      </main>
      {showTraining && (
        <TrainingModal close={() => setShowTraining(false)} config={config} />
      )}
    </div>
  );
}
