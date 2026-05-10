// ============================================
// FIREBASE CONFIG
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyBfIbx48JjQ0SbETDp4a-wwR9_lBAbhX70",
  authDomain: "cefas-website.firebaseapp.com",
  projectId: "cefas-website",
  storageBucket: "cefas-website.firebasestorage.app",
  messagingSenderId: "474668252634",
  appId: "1:474668252634:web:be627269a5a00de78294e3",
  measurementId: "G-MNCB2Z9XDC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Navbar scroll
const navbar=document.getElementById('navbar');
const scrollTop=document.getElementById('scrollTop');
window.addEventListener('scroll',()=>{
  navbar.classList.toggle('nav--scrolled',window.scrollY>50);
  scrollTop.classList.toggle('visible',window.scrollY>400);
});

// Mobile menu
function toggleMobile(){document.getElementById('mobileMenu').classList.toggle('active')}

// Login modal
function openLogin(){document.getElementById('loginModal').classList.add('active');document.body.style.overflow='hidden'}
function closeLogin(){document.getElementById('loginModal').classList.remove('active');document.body.style.overflow=''}
function switchTab(el){document.querySelectorAll('.login-modal__tab').forEach(t=>t.classList.remove('active'));el.classList.add('active')}

// Gallery filter
function filterGallery(btn,cat){
  document.querySelectorAll('.gallery__filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.gallery__item').forEach(item=>{
    item.style.display=(cat==='todos'||item.dataset.category===cat)?'':'none';
  });
}

// Lightbox
function openLightbox(cap){document.getElementById('lightboxCaption').textContent=cap;document.getElementById('lightbox').classList.add('active');document.body.style.overflow='hidden'}
function closeLightbox(){document.getElementById('lightbox').classList.remove('active');document.body.style.overflow=''}

// Scroll reveal
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')})},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Close modals
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLogin();closeLightbox()}});
document.getElementById('loginModal').addEventListener('click',e=>{if(e.target===document.getElementById('loginModal'))closeLogin()});
document.getElementById('lightbox').addEventListener('click',e=>{if(e.target===document.getElementById('lightbox'))closeLightbox()});

// ============================================
// LOGIN COM GOOGLE
// ============================================
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;

    await db.collection('usuarios').doc(user.uid).set({
      nome: user.displayName,
      email: user.email,
      foto: user.photoURL,
      tipo: 'aluno',
      ultimoLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    alert('Bem-vindo, ' + user.displayName + '!');
    closeLogin();
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro ao fazer login: ' + error.message);
  }
});

// ============================================
// LOGIN COM EMAIL/SENHA
// ============================================
document.querySelector('.login-modal__submit').addEventListener('click', async () => {
  const email = document.querySelector('.login-modal__field input[type="email"]').value;
  const senha = document.querySelector('.login-modal__field input[type="password"]').value;

  if (!email || !senha) {
    alert('Preencha todos os campos!');
    return;
  }

  try {
    const result = await auth.signInWithEmailAndPassword(email, senha);
    alert('Bem-vindo de volta!');
    closeLogin();
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      try {
        const newUser = await auth.createUserWithEmailAndPassword(email, senha);
        await db.collection('usuarios').doc(newUser.user.uid).set({
          email: email,
          tipo: 'aluno',
          criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Conta criada com sucesso!');
        closeLogin();
      } catch (createError) {
        alert('Erro ao criar conta: ' + createError.message);
      }
    } else {
      alert('Erro: ' + error.message);
    }
  }
});

// ============================================
// VERIFICAR SE ESTA LOGADO
// ============================================
auth.onAuthStateChanged((user) => {
  if (user) {
    const loginLinks = document.querySelectorAll('[onclick*="openLogin"]');
    loginLinks.forEach(link => {
      link.textContent = user.displayName || user.email.split('@')[0];
      link.removeAttribute('onclick');
    });
  }
});

// ============================================
// LOGOUT
// ============================================
function logout() {
  auth.signOut().then(() => {
    alert('Voce saiu da conta.');
    window.location.reload();
  });
}
