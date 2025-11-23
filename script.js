const commonWords = [
  'password','123456','qwerty','letmein','admin',
  'welcome','iloveyou','monkey','dragon','football'
];

const pwd = document.getElementById('pwd');
const toggle = document.getElementById('toggle');
const generateBtn = document.getElementById('generate');
const fill = document.querySelector('.meter-fill');
const label = document.getElementById('strength-label');
const scoreNum = document.getElementById('strength-score');
const criteriaDots = document.querySelectorAll('.dot');
const suggestionsEl = document.getElementById('suggestions');
const entropyEl = document.getElementById('entropy');
const ttcEl = document.getElementById('time-to-crack');

function evaluate(password){
  let score = 0;
  const length = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const uniqueChars = new Set(password).size;

  if(length >= 12) score += 40;
  else score += (length / 12) * 40;

  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  score += variety * 10;

  if(uniqueChars >= Math.min(12, length)) score += 10;

  const lower = password.toLowerCase();
  const isCommon = commonWords.includes(lower) ||
                   commonWords.some(w=> lower.includes(w));
  if(isCommon) score -= 30;

  if(/(.)\1{3,}/.test(password)) score -= 10;

  score = Math.round(Math.max(0, Math.min(100, score)));

  let charset = 0;
  if(hasLower) charset += 26;
  if(hasUpper) charset += 26;
  if(hasNumber) charset += 10;
  if(hasSymbol) charset += 32;
  const entropy = length ? Math.round(length * Math.log2(charset || 1)) : 0;

  return {score, length, hasLower, hasUpper, hasNumber, hasSymbol, uniqueChars, isCommon, entropy};
}

function timeToCrackBits(bits){
  const gps = 1000;
  const guesses = Math.pow(2, bits);
  const seconds = guesses / gps;

  const mins = seconds/60; 
  const hours = mins/60;
  const days = hours/24; 
  const years = days/365;

  if(years > 1000) return 'Centuries';
  if(years >= 1) return Math.round(years) + ' years';
  if(days >= 1) return Math.round(days) + ' days';
  if(hours >= 1) return Math.round(hours) + ' hours';
  if(mins >= 1) return Math.round(mins) + ' minutes';
  if(seconds >= 1) return Math.round(seconds) + ' seconds';
  return 'Instant';
}

function updateUI(){
  const val = pwd.value;
  const r = evaluate(val);

  fill.style.width = r.score + '%';
  if(r.score < 30) fill.style.background = 'linear-gradient(90deg,var(--red),#ff7b7b)';
  else if(r.score < 60) fill.style.background = 'linear-gradient(90deg,var(--yellow),#ffd27a)';
  else fill.style.background = 'linear-gradient(90deg,var(--green),#7ef1a1)';

  let strengthText = 'Very Weak';
  if(r.score >= 80) strengthText = 'Very Strong';
  else if(r.score >= 60) strengthText = 'Strong';
  else if(r.score >= 40) strengthText = 'Moderate';
  else if(r.score >= 20) strengthText = 'Weak';

  label.textContent = strengthText;
  scoreNum.textContent = r.score + '%';

  criteriaDots.forEach(dot => {
    const check = dot.dataset.check;
    dot.classList.remove('ok','warn','bad');

    if(check === 'length'){
      dot.classList.add(r.length >= 12 ? 'ok' : r.length >= 8 ? 'warn' : 'bad');
    } 
    else if(check === 'lower') dot.classList.toggle('ok', r.hasLower);
    else if(check === 'upper') dot.classList.toggle('ok', r.hasUpper);
    else if(check === 'number') dot.classList.toggle('ok', r.hasNumber);
    else if(check === 'symbol') dot.classList.toggle('ok', r.hasSymbol);
    else if(check === 'unique'){
      if(!r.isCommon && r.uniqueChars >= Math.min(8, r.length)) dot.classList.add('ok');
      else if(r.isCommon) dot.classList.add('bad');
      else dot.classList.add('warn');
    }
  });

  suggestionsEl.innerHTML = '';
  if(r.score < 60){
    generateSuggestions(val, 3).forEach(pass => {
      const wrap = document.createElement('div');
      wrap.className='suggestion';

      wrap.innerHTML = `
        <div class="text">${pass}</div>
        <button>Copy</button>
      `;

      wrap.querySelector('button').onclick = () => {
        navigator.clipboard.writeText(pass);
      };

      suggestionsEl.appendChild(wrap);
    });
  }

  entropyEl.textContent = r.entropy + ' bits';
  ttcEl.textContent = timeToCrackBits(r.entropy);
}

function generateSuggestions(base, count=2){
  const suggestions = [];
  const seeds = base && base.length ? [base] : ['mypassword','secure','access'];

  while(suggestions.length < count){
    const seed = seeds[suggestions.length % seeds.length];
    let p = seed;

    if(p.length < 12) p += randomChars(12 - p.length);

    if(Math.random() < 0.7) p = capitalizeRandom(p);
    if(Math.random() < 0.7) p = substituteChars(p);
    if(Math.random() < 0.5) p = insertSymbols(p);

    if(!/[0-9]/.test(p)) p += Math.floor(Math.random()*90+10);
    if(!/[^A-Za-z0-9]/.test(p)) p += '!#';

    if(p.length < 12) p += randomChars(12 - p.length);

    if(!suggestions.includes(p) && p !== base) suggestions.push(p);
  }
  return suggestions;
}

function randomChars(n){
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length:n},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
}

function capitalizeRandom(s){
  return s.split('').map(c=>Math.random()>0.7?c.toUpperCase():c).join('');
}

function substituteChars(s){
  const map = {'a':'@','s':'$','o':'0','i':'1','e':'3','t':'7'};
  return s.split('').map(ch => Math.random()>0.6 && map[ch.toLowerCase()] ? map[ch.toLowerCase()] : ch).join('');
}

function insertSymbols(s){
  const syms = '!@#$%^&*()-_+=';
  const pos = Math.floor(Math.random()*(s.length+1));
  const sym = syms[Math.floor(Math.random()*syms.length)];
  return s.slice(0,pos)+sym+s.slice(pos);
}

pwd.addEventListener('input', updateUI);

toggle.addEventListener('click', ()=>{
  pwd.type = pwd.type === 'password' ? 'text' : 'password';
  toggle.textContent = pwd.type === 'password' ? '👁️' : '🙈';
});

generateBtn.addEventListener('click', ()=>{
  const strong = generateSuggestions('',1)[0];
  pwd.value = strong;
  updateUI();
});

updateUI();
