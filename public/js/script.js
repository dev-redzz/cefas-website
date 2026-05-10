// Navbar scroll
const navbar=document.getElementById('navbar');
const scrollTop=document.getElementById('scrollTop');
window.addEventListener('scroll',()=>{
  navbar.classList.toggle('nav--scrolled',window.scrollY>50);
  scrollTop.classList.toggle('visible',window.scrollY>400);
});

// Mobile menu
function toggleMobile(){document.getElementById('mobileMenu').classList.toggle('active')}

// Login
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
