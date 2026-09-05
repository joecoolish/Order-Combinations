(function () {
  const form = document.getElementById('simulation-form');
  const participantsInput = document.getElementById('participants');
  const shortLotsInput = document.getElementById('shortLots');
  const simulationsInput = document.getElementById('simulations');
  const chart = document.getElementById('chart');
  const summary = document.getElementById('summary');
  const error = document.getElementById('error');

  function pickShortLotPositions(participants, shortLots) {
    const picked = new Set();
    while (picked.size < shortLots) {
      picked.add(Math.floor(Math.random() * participants));
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
      chart.appendChild(row);
    });

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

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.textContent = '';

    const participants = Number(participantsInput.value);
    const shortLots = Number(shortLotsInput.value);
    const simulations = Number(simulationsInput.value);

    if (!Number.isInteger(participants) || participants < 2) {
      clearOutput();
      error.textContent = 'Total participants must be an integer of 2 or more.';
      return;
    }

    if (!Number.isInteger(shortLots) || shortLots < 1 || shortLots >= participants) {
      clearOutput();
      error.textContent = 'Total short lots must be an integer from 1 up to participants - 1.';
      return;
    }

    if (!Number.isInteger(simulations) || simulations < 1) {
      clearOutput();
      error.textContent = 'Total simulations must be an integer of 1 or more.';
      return;
    }

    const probabilities = runSimulation(participants, shortLots, simulations);
    renderResults(probabilities, shortLots / participants);
  });
})();
