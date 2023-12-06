// menu mobile
function toggleMenu() {
  const menuMobile = document.getElementById("menu-mobile")

  if (menuMobile.className === "menu-mobile-active") {
    menuMobile.className = "menu-mobile"
  } else {
    menuMobile.className = "menu-mobile-active"
  }
};

// Navegar entre páginas
function confirmLogout() {
  localStorage.removeItem("fonte")
  window.location.replace("/aluno/logout")
}

// Imagem de perfil no menu
function imgMenu() {
  var savedImageMenu = localStorage.getItem('profileImage');
  if (savedImageMenu) {
    //ver a imagem dentro do localstorage
    var imageReviewElementMenu = document.getElementById('userimg');
    var iconMenu = document.getElementById('placeholdericon2')

    iconMenu.classList.add("hidden2");
    imageReviewElementMenu.classList.remove("hidden2");

    imageReviewElementMenu.style.backgroundImage = 'url(' + savedImageMenu + ')';

    var ImageReviewIconMenu = document.getElementById('icon2')
    ImageReviewIconMenu.style.display = 'none'
  } else {
    document.getElementById('userimg').classList.add('hidden2')
  }
}
imgMenu();

// Mostrar senha 
function togglePassword(passwordId) {
  var passwordInput = document.getElementById(passwordId);
  var icon = document.getElementById('olho' + passwordId.charAt(passwordId.length - 1));

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.className = "far fa-eye-slash";
  } else {
    passwordInput.type = "password";
    icon.className = "far fa-eye";
  }
}

// Logout automático por inatividade
let inactivityTimer;

function startInactivityTimer() {
  inactivityTimer = setTimeout(logout, 60 * 60 * 1000); // 1 hora
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  startInactivityTimer();
}

function logout() {
  // Adicione lógica de logout aqui
  console.log('Logout automático após inatividade');
  // Redirecionar para a página de logout ou fazer outras ações
}

// Iniciar o temporizador quando a página é carregada ou o usuário faz login
startInactivityTimer();

// Reiniciar o temporizador sempre que houver interação do usuário
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keydown', resetInactivityTimer);

function logout() {
  window.location.href = '/logout'; // Redirecionar para a rota de logout
}