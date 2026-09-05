(function () {
  const form = document.getElementById('simulation-form');
  const participantsInput = document.getElementById('participants');
  const shortLotsInput = document.getElementById('shortLots');
  const simulationsInput = document.getElementById('simulations');
  const chart = document.getElementById('chart');
  const summary = document.getElementById('summary');
  const error = document.getElementById('error');
  const MAX_PARTICIPANTS = 2000;
  const MAX_SIMULATIONS = 1000000;
  const MAX_TOTAL_SHORT_LOT_DRAWS = 20000000;
  const MAX_TOTAL_POSITION_EVALUATIONS = 50000000;

  function pickShortLotPositions(participants, shortLots) {
    // Floyd's algorithm: uniformly sample shortLots unique positions in O(shortLots).
    const picked = new Set();
    for (let index = participants - shortLots; index < participants; index += 1) {
      const candidate = Math.floor(Math.random() * (index + 1));
      picked.add(picked.has(candidate) ? index : candidate);
    }
    return picked;
  }

  function runSimulation(participants, shortLots, simulations) {
    const shortLotCounts = new Array(participants).fill(0);

    for (let i = 0; i < simulations; i += 1) {
      const shortLotPositions = pickShortLotPositions(participants, shortLots);
      shortLotPositions.forEach((position) => {
        shortLotCounts[position] += 1;
      });
    }

    return shortLotCounts.map((count) => count / simulations);
  }

  function toPercent(probability) {
    return `${(probability * 100).toFixed(2)}%`;
  }

  function renderResults(probabilities, theoretical) {
    chart.innerHTML = '';
    const fragment = document.createDocumentFragment();

    probabilities.forEach((probability, index) => {
      const row = document.createElement('div');
      row.className = 'bar-row';

      const position = document.createElement('span');
      position.textContent = `Position ${index + 1}`;

      const track = document.createElement('div');
      track.className = 'bar-track';

      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = `${Math.max(0, Math.min(100, probability * 100))}%`;
      track.appendChild(fill);

      const label = document.createElement('span');
      label.textContent = toPercent(probability);

      row.append(position, track, label);
      fragment.appendChild(row);
    });
    chart.appendChild(fragment);

    const first = probabilities[0];
    const last = probabilities[probabilities.length - 1];
    summary.textContent = `Theoretical chance per position is ${toPercent(theoretical)}. ` +
      `First position: ${toPercent(first)}. Last position: ${toPercent(last)}. ` +
      'Across enough simulations, positions converge to the same probability, so order does not change the odds.';
  }

  function clearOutput() {
    summary.textContent = '';
    chart.innerHTML = '';
  }

  function updateShortLotsMax() {
    const participants = Number(participantsInput.value);
    if (!Number.isInteger(participants) || participants < 2) {
      shortLotsInput.removeAttribute('max');
      return;
    }
    const max = participants - 1;
    shortLotsInput.max = String(max);
    if (Number(shortLotsInput.value) > max) {
      shortLotsInput.value = String(max);
    }
  }

  participantsInput.addEventListener('input', updateShortLotsMax);
  updateShortLotsMax();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.textContent = '';

    const participants = Number(participantsInput.value);
    const shortLots = Number(shortLotsInput.value);
    const simulations = Number(simulationsInput.value);

    if (!Number.isInteger(participants) || participants < 2 || participants > MAX_PARTICIPANTS) {
      clearOutput();
      error.textContent = `Total participants must be an integer from 2 to ${MAX_PARTICIPANTS}.`;
      return;
    }

    if (!Number.isInteger(shortLots) || shortLots < 1 || shortLots >= participants) {
      clearOutput();
      error.textContent = 'Total short lots must be an integer from 1 up to participants - 1.';
      return;
    }

    if (!Number.isInteger(simulations) || simulations < 1 || simulations > MAX_SIMULATIONS) {
      clearOutput();
      error.textContent = `Total simulations must be an integer from 1 to ${MAX_SIMULATIONS}.`;
      return;
    }

    if (shortLots * simulations > MAX_TOTAL_SHORT_LOT_DRAWS) {
      clearOutput();
      error.textContent = `Input combination is too large to run in-browser. Keep short lots × simulations at or below ${MAX_TOTAL_SHORT_LOT_DRAWS.toLocaleString()}.`;
      return;
    }

    if (participants * simulations > MAX_TOTAL_POSITION_EVALUATIONS) {
      clearOutput();
      error.textContent = `Input combination is too large to render in-browser. Keep participants × simulations at or below ${MAX_TOTAL_POSITION_EVALUATIONS.toLocaleString()}.`;
      return;
    }

    const probabilities = runSimulation(participants, shortLots, simulations);
    renderResults(probabilities, shortLots / participants);
  });
})();
