const validatorLab = document.querySelector('[data-validator-lab]');

const validationStates = {
  draft: {
    subject: 'URGENT: get 3x more output',
    copy: 'A guaranteed return with zero risk. Act now before this opportunity disappears.',
    cta: 'Click here',
    ctaMeta: 'HTTP ↗',
    postscript: 'No postscript supplied.',
    verdict: 'BLOCKED',
    errors: 6,
    checks: [
      ['Subject length', true, 'PASS'],
      ['Spam-trigger language', false, 'FAIL'],
      ['HTTPS CTA', false, 'FAIL'],
      ['Sourced numeric claims', false, 'FAIL'],
      ['Required postscript', false, 'FAIL'],
    ],
  },
  validated: {
    subject: 'The invisible queue',
    copy: 'The harder delay to notice is work sitting between two people, waiting for context. We call it the Invisible Queue.',
    cta: 'Map one invisible queue',
    ctaMeta: 'HTTPS ↗',
    postscript: 'P.S. The next lesson maps the handoff without buying software.',
    verdict: 'PASS',
    errors: 0,
    checks: [
      ['Subject length', true, 'PASS'],
      ['Spam-trigger language', true, 'PASS'],
      ['HTTPS CTA', true, 'PASS'],
      ['Sourced numeric claims', true, 'PASS'],
      ['Required postscript', true, 'PASS'],
    ],
  },
};

function renderValidation(stateName) {
  if (!validatorLab || !validationStates[stateName]) return;
  const state = validationStates[stateName];
  validatorLab.querySelector('[data-message-subject]').textContent = state.subject;
  validatorLab.querySelector('[data-message-copy]').textContent = state.copy;
  const cta = validatorLab.querySelector('[data-message-cta]');
  cta.firstChild.textContent = `${state.cta} `;
  cta.querySelector('span').textContent = state.ctaMeta;
  validatorLab.querySelector('[data-message-postscript]').textContent = state.postscript;
  validatorLab.querySelector('[data-validation-verdict]').textContent = state.verdict;
  validatorLab.querySelector('[data-error-count]').textContent = state.errors;
  validatorLab.querySelector('[data-check-stack]').innerHTML = state.checks.map(([label, passed, result]) => `
    <div class="validation-check${passed ? '' : ' is-error'}">
      <i aria-hidden="true">${passed ? '✓' : '!'}</i><b>${label}</b><span>${result}</span>
    </div>`).join('');
  validatorLab.querySelectorAll('[data-validation-state]').forEach((tab) => {
    const selected = tab.dataset.validationState === stateName;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
}

validatorLab?.querySelectorAll('[data-validation-state]').forEach((tab, index, tabs) => {
  tab.addEventListener('click', () => renderValidation(tab.dataset.validationState));
  tab.addEventListener('keydown', (event) => {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    tabs[nextIndex].focus();
    renderValidation(tabs[nextIndex].dataset.validationState);
  });
});

renderValidation('validated');
