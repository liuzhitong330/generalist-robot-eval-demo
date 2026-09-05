(() => {
  "use strict";

  const rows = window.GENERALIST_DATA;
  const families = ["dexterity", "applications", "generalization"];
  let family = "applications";
  let selectedId = "b2s";

  const tabs = document.getElementById("family-tabs");
  const weight = document.getElementById("prediction-weight");
  const weightReadout = document.getElementById("weight-readout");
  const plot = document.getElementById("mixture-plot");
  const ranking = document.getElementById("ranking");
  const selectionReadout = document.getElementById("selection-readout");
  const contrastTitle = document.getElementById("contrast-title");
  const contrastCopy = document.getElementById("contrast-copy");
  const baseline = document.getElementById("baseline-rate");
  const effect = document.getElementById("effect-size");

  function label(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

  function normalize(value, values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return max === min ? 0 : (value - min) / (max - min);
  }

  function scoredRows() {
    const predValues = rows.map(row => row.pred[family]);
    const klValues = rows.map(row => row.kl[family]);
    const w = Number(weight.value) / 100;
    return rows.map(row => ({
      ...row,
      score: w * normalize(row.pred[family], predValues) + (1 - w) * normalize(row.kl[family], klValues)
    })).sort((a, b) => a.score - b.score);
  }

  function renderTabs() {
    tabs.innerHTML = "";
    families.forEach(name => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label(name);
      button.setAttribute("aria-pressed", String(name === family));
      button.addEventListener("click", () => { family = name; render(); });
      tabs.appendChild(button);
    });
  }

  function svgNode(name, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function renderPlot(scored) {
    const width = 700;
    const height = 410;
    const margin = { top: 28, right: 28, bottom: 62, left: 78 };
    const predValues = rows.map(row => row.pred[family]);
    const klValues = rows.map(row => row.kl[family]);
    const xMin = Math.min(...predValues);
    const xMax = Math.max(...predValues);
    const yMin = Math.min(...klValues);
    const yMax = Math.max(...klValues);
    const xPad = (xMax - xMin) * 0.12;
    const yPad = (yMax - yMin) * 0.12;
    const x = value => margin.left + ((value - (xMin - xPad)) / ((xMax + xPad) - (xMin - xPad))) * (width - margin.left - margin.right);
    const y = value => height - margin.bottom - ((value - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * (height - margin.top - margin.bottom);

    plot.innerHTML = "";
    const title = svgNode("title", { id: "plot-title" });
    title.textContent = `${label(family)} data-mixture measurements`;
    plot.appendChild(title);
    const desc = svgNode("desc", { id: "plot-desc" });
    desc.textContent = "Lower prediction error and lower reverse KL appear toward the bottom left.";
    plot.appendChild(desc);

    for (let i = 0; i < 4; i += 1) {
      const t = i / 3;
      const xv = xMin - xPad + t * ((xMax + xPad) - (xMin - xPad));
      const yv = yMin - yPad + t * ((yMax + yPad) - (yMin - yPad));
      const xPos = x(xv);
      const yPos = y(yv);
      plot.appendChild(svgNode("line", { x1: xPos, y1: margin.top, x2: xPos, y2: height - margin.bottom, class: "grid-line" }));
      plot.appendChild(svgNode("line", { x1: margin.left, y1: yPos, x2: width - margin.right, y2: yPos, class: "grid-line" }));
      const xt = svgNode("text", { x: xPos, y: height - 34, "text-anchor": "middle", class: "axis-text" });
      xt.textContent = xv.toFixed(6);
      plot.appendChild(xt);
      const yt = svgNode("text", { x: margin.left - 12, y: yPos + 4, "text-anchor": "end", class: "axis-text" });
      yt.textContent = yv.toFixed(6);
      plot.appendChild(yt);
    }

    const xLabel = svgNode("text", { x: (margin.left + width - margin.right) / 2, y: height - 6, "text-anchor": "middle", class: "axis-label" });
    xLabel.textContent = "Validation prediction error → higher";
    plot.appendChild(xLabel);
    const yLabel = svgNode("text", { x: 18, y: height / 2, transform: `rotate(-90 18 ${height / 2})`, "text-anchor": "middle", class: "axis-label" });
    yLabel.textContent = "Reverse KL → higher";
    plot.appendChild(yLabel);

    const topId = scored[0].id;
    const labelPlacement = {
      a1: { dx: 10, dy: -10, anchor: "start" },
      a2: { dx: 10, dy: -10, anchor: "start" },
      a3: { dx: -10, dy: -18, anchor: "end" },
      a23: { dx: -10, dy: -10, anchor: "end" },
      b1: { dx: -10, dy: -10, anchor: "end" },
      b2o: { dx: -10, dy: 18, anchor: "end" },
      b2s: { dx: 10, dy: 20, anchor: "start" },
      c3: { dx: 10, dy: -10, anchor: "start" }
    };

    rows.forEach(row => {
      const group = svgNode("g", {
        class: `point${row.id === selectedId ? " selected" : ""}${row.id === topId ? " top" : ""}`,
        tabindex: "0",
        role: "button",
        "aria-label": `${row.mixture}. Prediction error ${row.pred[family].toFixed(8)}. Reverse KL ${row.kl[family].toFixed(8)}.`
      });
      const cx = x(row.pred[family]);
      const cy = y(row.kl[family]);
      group.appendChild(svgNode("circle", { cx, cy, r: 7 }));
      if (row.id === selectedId || row.id === topId) {
        const placement = labelPlacement[row.id];
        const text = svgNode("text", {
          x: cx + placement.dx,
          y: cy + placement.dy,
          "text-anchor": placement.anchor
        });
        text.textContent = row.short;
        group.appendChild(text);
      }
      const select = () => { selectedId = row.id; render(); };
      group.addEventListener("click", select);
      group.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
      });
      plot.appendChild(group);
    });
  }

  function renderRanking(scored) {
    ranking.innerHTML = "";
    scored.forEach((row, index) => {
      const line = document.createElement("div");
      line.className = "rank-row";
      const number = document.createElement("span");
      number.textContent = String(index + 1);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = row.mixture;
      button.addEventListener("click", () => { selectedId = row.id; render(); });
      const score = document.createElement("span");
      score.className = "score";
      score.textContent = row.score.toFixed(3);
      line.append(number, button, score);
      ranking.appendChild(line);
    });
  }

  function renderReadout(scored) {
    const row = rows.find(item => item.id === selectedId);
    const rank = scored.findIndex(item => item.id === selectedId) + 1;
    selectionReadout.innerHTML = `<strong>${row.mixture}</strong> ranks ${rank} of ${rows.length} under the current rule for ${family}. Source values: prediction error ${row.pred[family].toFixed(8)}; reverse KL ${row.kl[family].toFixed(8)}.`;
    const top = scored[0];
    const contrast = family === "applications" && top.id === "b2s"
      ? rows.find(item => item.id === "a23")
      : scored.find(item => item.id !== top.id);
    contrastTitle.textContent = `${label(family)}: ${top.short} vs ${contrast.short}`;
    contrastCopy.textContent = `The current rule nominates ${top.short}. Compare it against ${contrast.short} in a blinded, counterbalanced test; keep the offline score as the nomination record, not the outcome.`;
  }

  function updateBudget() {
    const p1 = Number(baseline.value) / 100;
    const delta = Number(effect.value) / 100;
    const p2 = Math.min(p1 + delta, 0.99);
    const pBar = (p1 + p2) / 2;
    const zAlpha = 1.959964;
    const zPower = 0.841621;
    const numerator = Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zPower * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const n = Math.ceil(numerator / Math.pow(p2 - p1, 2));
    document.getElementById("baseline-output").textContent = `${Math.round(p1 * 100)}%`;
    document.getElementById("effect-output").textContent = `${Math.round((p2 - p1) * 100)} points`;
    document.getElementById("rollout-count").textContent = n.toLocaleString();
    document.getElementById("budget-note").textContent = `${(n * 2).toLocaleString()} planned rollouts total to compare ${Math.round(p1 * 100)}% with ${Math.round(p2 * 100)}%, before invalid runs or blocked-condition inflation.`;
  }

  function render() {
    const predWeight = Number(weight.value);
    weightReadout.textContent = `${predWeight}% prediction error · ${100 - predWeight}% reverse KL`;
    renderTabs();
    const scored = scoredRows();
    renderPlot(scored);
    renderRanking(scored);
    renderReadout(scored);
  }

  weight.addEventListener("input", render);
  baseline.addEventListener("input", updateBudget);
  effect.addEventListener("input", updateBudget);
  render();
  updateBudget();
})();
