(function () {
  const form = document.getElementById('simulation-form');
  const participantsInput = document.getElementById('participants');
  const shortLotsInput = document.getElementById('shortLots');
  const simulationsInput = document.getElementById('simulations');
  const chart = document.getElementById('chart');
  const summary = document.getElementById('summary');
  const error = document.getElementById('error');
  const submitButton = form.querySelector('button[type="submit"]');
  const MAX_PARTICIPANTS = 2000;
  const MAX_SIMULATIONS = 1000000;
  const MAX_TOTAL_PARTICIPANT_DRAWS = 20000000;
  const LOW_SIMULATION_THRESHOLD = 1000;
  const HIGH_DEVIATION_THRESHOLD = 0.02;
  const SIMULATION_CHUNK_SIZE = 10000;

  function nextFrame() {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve());
        return;
      }
      setTimeout(resolve, 0);
    });
  }

  async function runSimulation(participants, shortLots, simulations, onProgress) {
    const shortLotCounts = new Array(participants).fill(0);
    const remainingLots = new Uint8Array(participants);

    for (let start = 0; start < simulations; start += SIMULATION_CHUNK_SIZE) {
      const end = Math.min(simulations, start + SIMULATION_CHUNK_SIZE);
      for (let i = start; i < end; i += 1) {
        remainingLots.fill(1, 0, shortLots);
        remainingLots.fill(0, shortLots);
        let remainingCount = participants;

        for (let person = 0; person < participants; person += 1) {
          const lotIndex = Math.floor(Math.random() * remainingCount);
          const pickedShortLot = remainingLots[lotIndex] === 1;
          remainingCount -= 1;
          remainingLots[lotIndex] = remainingLots[remainingCount];
          if (pickedShortLot) {
            shortLotCounts[person] += 1;
          }
        }
      }
      onProgress(end, simulations);
      if (end < simulations) {
        // Yield so the browser can repaint while simulation is running.
        await nextFrame();
      }
    }

    return shortLotCounts.map((count) => count / simulations);
  }

  function toPercent(probability) {
    return `${(probability * 100).toFixed(2)}%`;
  }

  function renderResults(probabilities, theoretical, simulations) {
    chart.innerHTML = '';
    const fragment = document.createDocumentFragment();

    probabilities.forEach((probability, index) => {
      const row = document.createElement('div');
      row.className = 'bar-row';

      const position = document.createElement('span');
      position.textContent = `Draw position ${index + 1}`;

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
    const maxDeviation = probabilities.reduce(
      (largest, probability) => Math.max(largest, Math.abs(probability - theoretical)),
      0
    );
    const convergenceNote =
      simulations < LOW_SIMULATION_THRESHOLD && maxDeviation > HIGH_DEVIATION_THRESHOLD
        ? 'The simulation measures each draw position in order, and with a low simulation count, visible variation between positions is expected from randomness.'
        : 'The simulation measures each draw position in order. Across enough simulations, positions converge to the same probability, so order does not change the underlying odds.';
    summary.textContent = `Theoretical chance per position is ${toPercent(theoretical)}. ` +
      `First position: ${toPercent(first)}. Last position: ${toPercent(last)}. ` +
      convergenceNote;
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
  }

  participantsInput.addEventListener('input', updateShortLotsMax);
  participantsInput.max = String(MAX_PARTICIPANTS);
  simulationsInput.max = String(MAX_SIMULATIONS);
  updateShortLotsMax();

  form.addEventListener('submit', async (event) => {
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

    if (participants * simulations > MAX_TOTAL_PARTICIPANT_DRAWS) {
      clearOutput();
      error.textContent = `Input combination is too large to run in-browser. Keep participants × simulations at or below ${MAX_TOTAL_PARTICIPANT_DRAWS.toLocaleString()}.`;
      return;
    }

    submitButton.disabled = true;
    summary.textContent = 'Running simulation... 0%';
    chart.innerHTML = '';

    try {
      const probabilities = await runSimulation(participants, shortLots, simulations, (completed, total) => {
        summary.textContent = `Running simulation... ${((completed / total) * 100).toFixed(0)}%`;
      });
      renderResults(probabilities, shortLots / participants, simulations);
    } finally {
      submitButton.disabled = false;
    }
  });
})();
