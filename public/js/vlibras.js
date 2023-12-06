
const divVlibras = document.getElementById('vlibras')
const vLibrasToggle = document.getElementById('vlibrasToggle')

function lerCondicaoVLibras() {
    var cnd = localStorage.getItem('VLibras');
    if (cnd === 'true') {
        divVlibras.classList.add('enabled');
        vLibrasToggle.checked = true
    } else {
        divVlibras.classList.remove('enabled');
    }
}

vLibrasToggle.addEventListener('change', function() {
  var cnd = vlibrasToggle.checked;
  localStorage.setItem('VLibras', cnd);
  lerCondicaoVLibras()
})

lerCondicaoVLibras();
