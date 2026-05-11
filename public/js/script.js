// ============================================
// FIREBASE CONFIG
// ============================================
firebase.initializeApp({
  apiKey: "AIzaSyBfIbx48JjQ0SbETDp4a-wwR9_lBAbhX70",
  authDomain: "cefas-website.firebaseapp.com",
  projectId: "cefas-website",
  storageBucket: "cefas-website.firebasestorage.app",
  messagingSenderId: "474668252634",
  appId: "1:474668252634:web:be627269a5a00de78294e3",
  measurementId: "G-MNCB2Z9XDC"
});
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const ADMIN_EMAIL = 'redzenzag@gmail.com';

// ============================================
// SYNC USER: quando login acontece, verifica se o admin
// ja cadastrou esse email e vincula ao UID do Firebase Auth
// ============================================
async function syncUser(user) {
  const uid = user.uid;
  const email = user.email;

  // 1) Check if UID doc already exists and is configured
  const uidDoc = await db.collection('usuarios').doc(uid).get();
  if (uidDoc.exists && uidDoc.data().tipo && uidDoc.data().tipo !== 'visitante') {
    // Already synced, just update login time
    await db.collection('usuarios').doc(uid).update({
      ultimoLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
    return uidDoc.data();
  }

  // 2) Search if admin registered this email (doc ID = email sanitized)
  const emailKey = email.replace(/[^a-zA-Z0-9]/g, '_');
  const adminDoc = await db.collection('usuarios').doc(emailKey).get();

  if (adminDoc.exists && adminDoc.data().tipo === 'aluno') {
    // Admin registered this person! Copy data to UID doc
    const data = adminDoc.data();
    await db.collection('usuarios').doc(uid).set({
      nome: user.displayName || data.nome,
      email: email,
      foto: user.photoURL || '',
      tipo: data.tipo,
      status: data.status,
      cursoNome: data.cursoNome || '',
      telefone: data.telefone || '',
      criadoEm: data.criadoEm || firebase.firestore.FieldValue.serverTimestamp(),
      ultimoLogin: firebase.firestore.FieldValue.serverTimestamp(),
      vinculadoDe: emailKey
    });
    // Delete old email-keyed doc to avoid confusion
    await db.collection('usuarios').doc(emailKey).delete();
    return { tipo: data.tipo, status: data.status };
  }

  // 3) Also check by email field query (in case doc was created differently)
  const emailQuery = await db.collection('usuarios').where('email', '==', email).get();
  let found = null;
  emailQuery.forEach(doc => {
    if (doc.id !== uid && doc.data().tipo === 'aluno') {
      found = { id: doc.id, data: doc.data() };
    }
  });

  if (found) {
    await db.collection('usuarios').doc(uid).set({
      nome: user.displayName || found.data.nome,
      email: email,
      foto: user.photoURL || '',
      tipo: found.data.tipo,
      status: found.data.status,
      cursoNome: found.data.cursoNome || '',
      telefone: found.data.telefone || '',
      criadoEm: found.data.criadoEm || firebase.firestore.FieldValue.serverTimestamp(),
      ultimoLogin: firebase.firestore.FieldValue.serverTimestamp(),
      vinculadoDe: found.id
    });
    await db.collection('usuarios').doc(found.id).delete();
    return { tipo: found.data.tipo, status: found.data.status };
  }

  // 4) No admin registration found - create as visitante
  if (!uidDoc.exists) {
    await db.collection('usuarios').doc(uid).set({
      nome: user.displayName || '',
      email: email,
      foto: user.photoURL || '',
      tipo: 'visitante',
      status: 'ativo',
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      ultimoLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
  } else {
    await db.collection('usuarios').doc(uid).update({
      ultimoLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  return uidDoc.exists ? uidDoc.data() : { tipo: 'visitante', status: 'ativo' };
}

// ============================================
// ROLE-BASED REDIRECT
// ============================================
async function redirectToPortal(user, userData) {
  if (user.email === ADMIN_EMAIL) {
    window.location.href = 'admin.html'; return;
  }
  // Check professor (by email in professores collection)
  try {
    const profSnap = await db.collection('professores').where('email', '==', user.email).get();
    if (!profSnap.empty) {
      window.location.href = 'portal-professor.html'; return;
    }
  } catch (e) { console.error(e) }
  // Check aluno
  if (userData && userData.tipo === 'aluno' && userData.status === 'aprovado') {
    window.location.href = 'portal.html'; return;
  }
  alert('Bem-vindo! Para acessar o portal, faca sua inscricao em um dos nossos cursos na secao Atuacao.');
}

// ============================================
// UI HELPERS
// ============================================
const navbar = document.getElementById('navbar');
const scrollTop = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('nav--scrolled', window.scrollY > 50);
  scrollTop.classList.toggle('visible', window.scrollY > 400);
});
function toggleMobile() { document.getElementById('mobileMenu').classList.toggle('active') }
function openLogin() { document.getElementById('loginModal').classList.add('active'); document.body.style.overflow = 'hidden' }
function closeLogin() { document.getElementById('loginModal').classList.remove('active'); document.body.style.overflow = '' }
function switchTab(el) { document.querySelectorAll('.login-modal__tab').forEach(t => t.classList.remove('active')); el.classList.add('active') }
function filterGallery(btn, cat) {
  document.querySelectorAll('.gallery__filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.gallery__item').forEach(item => {
    item.style.display = (cat === 'todos' || item.dataset.category === cat) ? '' : 'none';
  });
}
function openLightbox(cap) { document.getElementById('lightboxCaption').textContent = cap; document.getElementById('lightbox').classList.add('active'); document.body.style.overflow = 'hidden' }
function closeLightbox() { document.getElementById('lightbox').classList.remove('active'); document.body.style.overflow = '' }
const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }) }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeLogin(); closeLightbox(); closeInscricaoModal() } });
document.getElementById('loginModal').addEventListener('click', e => { if (e.target === document.getElementById('loginModal')) closeLogin() });
document.getElementById('lightbox').addEventListener('click', e => { if (e.target === document.getElementById('lightbox')) closeLightbox() });

// ============================================
// LOGIN COM GOOGLE
// ============================================
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    closeLogin();
    const userData = await syncUser(user);
    await redirectToPortal(user, userData);
  } catch (error) {
    console.error('Erro no login:', error);
    if (error.code !== 'auth/popup-closed-by-user') {
      alert('Erro ao fazer login: ' + error.message);
    }
  }
});

// ============================================
// LOGIN COM EMAIL/SENHA
// ============================================
document.querySelector('.login-modal__submit').addEventListener('click', async () => {
  const email = document.querySelector('.login-modal__field input[type="email"]').value;
  const senha = document.querySelector('.login-modal__field input[type="password"]').value;
  if (!email || !senha) { alert('Preencha todos os campos!'); return }
  try {
    const result = await auth.signInWithEmailAndPassword(email, senha);
    closeLogin();
    const userData = await syncUser(result.user);
    await redirectToPortal(result.user, userData);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      try {
        const newUser = await auth.createUserWithEmailAndPassword(email, senha);
        closeLogin();
        const userData = await syncUser(newUser.user);
        await redirectToPortal(newUser.user, userData);
      } catch (createError) {
        alert('Erro ao criar conta: ' + createError.message);
      }
    } else {
      alert('Erro: ' + error.message);
    }
  }
});

// ============================================
// NAVBAR: mostra link do portal se logado
// ============================================
auth.onAuthStateChanged(async (user) => {
  const navLinks = document.querySelector('.nav__links');
  const enterLink = navLinks.querySelector('[onclick*="openLogin"]');
  if (!user || !enterLink) return;

  let portalHref = '#';
  let portalText = 'Meu Portal';

  if (user.email === ADMIN_EMAIL) {
    portalHref = 'admin.html'; portalText = 'Painel Admin';
  } else {
    try {
      const ps = await db.collection('professores').where('email', '==', user.email).get();
      if (!ps.empty) { portalHref = 'portal-professor.html'; portalText = 'Portal Professor'; }
    } catch (e) {}
    if (portalHref === '#') {
      try {
        const ud = await db.collection('usuarios').doc(user.uid).get();
        if (ud.exists && ud.data().tipo === 'aluno' && ud.data().status === 'aprovado') {
          portalHref = 'portal.html'; portalText = 'Portal do Aluno';
        }
      } catch (e) {}
    }
  }

  if (portalHref !== '#') {
    const portalLink = document.createElement('a');
    portalLink.href = portalHref;
    portalLink.className = 'nav__portal';
    portalLink.textContent = portalText;
    enterLink.replaceWith(portalLink);
  } else {
    enterLink.textContent = (user.displayName || user.email.split('@')[0]);
    enterLink.setAttribute('onclick', '');
    enterLink.onclick = (e) => { e.preventDefault(); if (confirm('Deseja sair da conta?')) logout(); };
  }
});

function logout() { auth.signOut().then(() => { window.location.reload() }) }

// ============================================
// INSCRICAO DE CURSOS
// ============================================
function openInscricaoModal(cursoNome) {
  const m = document.getElementById('inscricaoModal');
  if (!m) return;
  document.getElementById('inscCursoNome').textContent = cursoNome;
  document.getElementById('inscCursoVal').value = cursoNome;
  const u = auth.currentUser;
  if (u) {
    document.getElementById('inscNome').value = u.displayName || '';
    document.getElementById('inscEmail').value = u.email || '';
  }
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeInscricaoModal() {
  const m = document.getElementById('inscricaoModal');
  if (m) { m.classList.remove('active'); document.body.style.overflow = '' }
}

async function submitInscricao() {
  const nome = document.getElementById('inscNome').value.trim();
  const email = document.getElementById('inscEmail').value.trim();
  const idade = document.getElementById('inscIdade').value.trim();
  const tel = document.getElementById('inscTel').value.trim();
  const endereco = document.getElementById('inscEndereco').value.trim();
  const motivo = document.getElementById('inscMotivo').value.trim();
  const curso = document.getElementById('inscCursoVal').value;
  if (!nome || !email || !idade) { alert('Preencha nome, email e idade!'); return }

  const btn = document.querySelector('#inscricaoModal .insc-btn');
  btn.textContent = 'Enviando...'; btn.disabled = true;

  try {
    let user = auth.currentUser;
    if (!user) {
      alert('Voce precisa estar logado para se inscrever. Faca login primeiro.');
      btn.textContent = 'Enviar Inscricao'; btn.disabled = false;
      closeInscricaoModal(); openLogin(); return;
    }
    let courseId = '';
    try {
      const cs = await db.collection('cursos').where('nome', '==', curso).get();
      if (!cs.empty) courseId = cs.docs[0].id;
    } catch (e) {}

    await db.collection('inscricoes').add({
      userId: user.uid, nome: nome, email: email, idade: idade, telefone: tel,
      endereco: endereco, motivo: motivo, curso: curso, courseId: courseId,
      status: 'pendente', criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('usuarios').doc(user.uid).set({
      nome: nome, email: email, tipo: 'visitante', status: 'pendente',
      ultimoLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    alert('Inscricao enviada com sucesso! Aguarde a aprovacao da secretaria do CESFA.');
    closeInscricaoModal();
    document.getElementById('inscNome').value = '';
    document.getElementById('inscEmail').value = '';
    document.getElementById('inscIdade').value = '';
    document.getElementById('inscTel').value = '';
    document.getElementById('inscEndereco').value = '';
    document.getElementById('inscMotivo').value = '';
  } catch (error) {
    console.error(error);
    alert('Erro ao enviar inscricao: ' + error.message);
  }
  btn.textContent = 'Enviar Inscricao'; btn.disabled = false;
}

document.addEventListener('click', e => {
  const m = document.getElementById('inscricaoModal');
  if (m && e.target === m) closeInscricaoModal();
});

// ============================================
// LOAD CURSOS DO FIRESTORE
// ============================================
async function loadCursosSite() {
  try {
    const snap = await db.collection('cursos').where('status', '==', 'aberto').get();
    const grid = document.getElementById('cursosGrid');
    if (!grid || snap.empty) return;

    const icons = [
      '<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.4)" stroke-width="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
      '<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.4)" stroke-width="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
      '<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.4)" stroke-width="1.5"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
    ];
    const colors = ['linear-gradient(135deg,#7A5230,#5C3A1E)', 'linear-gradient(135deg,#3A6B1E,#2D5016)', 'linear-gradient(135deg,#C59A3F,#A0632E)'];

    let h = '', i = 0;
    snap.forEach(doc => {
      const d = doc.data();
      const delay = i > 0 ? ' reveal-d' + i : '';
      h += '<div class="program-card reveal' + delay + '">';
      h += '<div class="program-card__img" style="background:' + colors[i % 3] + '">' + icons[i % 3] + '</div>';
      h += '<div class="program-card__body">';
      h += '<h3 class="program-card__title">' + d.nome + '</h3>';
      h += '<p class="program-card__desc">' + (d.descricao || '') + '</p>';
      h += '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">';
      if (d.vagas) h += '<span style="font-family:var(--font-heading);font-size:.65rem;font-weight:700;color:var(--primary);background:var(--cream-dark);padding:3px 10px;border-radius:12px">' + d.vagas + ' vagas</span>';
      if (d.horario) h += '<span style="font-family:var(--font-heading);font-size:.65rem;font-weight:700;color:var(--text-muted);background:var(--cream-dark);padding:3px 10px;border-radius:12px">' + d.horario + '</span>';
      if (d.faixaEtaria) h += '<span style="font-family:var(--font-heading);font-size:.65rem;font-weight:700;color:var(--text-muted);background:var(--cream-dark);padding:3px 10px;border-radius:12px">' + d.faixaEtaria + '</span>';
      h += '</div>';
      h += '<button onclick="openInscricaoModal(\'' + d.nome.replace(/'/g, "\\'") + '\')" style="margin-top:14px;padding:10px 24px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-family:var(--font-heading);font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;transition:all .25s ease" onmouseover="this.style.background=\'var(--primary-dark)\'" onmouseout="this.style.background=\'var(--primary)\'">Inscrever-se</button>';
      h += '</div></div>';
      i++;
    });
    grid.innerHTML = h;
    grid.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  } catch (e) { console.error('Erro ao carregar cursos:', e) }
}
loadCursosSite();

// ============================================
// COOKIES
// ============================================
function acceptCookies() {
  document.getElementById('cookiesBanner').classList.add('hidden');
  try { localStorage.setItem('cesfa_cookies', 'accepted'); } catch (e) {}
}
function declineCookies() {
  document.getElementById('cookiesBanner').classList.add('hidden');
  try { localStorage.setItem('cesfa_cookies', 'declined'); } catch (e) {}
}
try { if (localStorage.getItem('cesfa_cookies')) document.getElementById('cookiesBanner').classList.add('hidden'); } catch (e) {}
