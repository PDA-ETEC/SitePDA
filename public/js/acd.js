const themeStorageKey = "theme";

const Theme = {
  light: "light",
  dark: "dark",
};

let theme = Theme.light;

function setTheme(value) {
  theme = value;
  const rootElem = document.documentElement;
  rootElem.setAttribute("data-theme", theme);
  localStorage.setItem(themeStorageKey, theme);
}

function switchTheme() {
  if (theme === Theme.light) {
    setTheme(Theme.dark);
  } else {
    setTheme(Theme.light);
  }
}

function useEffect(callback, dependencies) {
  callback();
}

useEffect(function () {
  setTheme(localStorage.getItem(themeStorageKey) || Theme.light);
}, []);

useEffect(function () {
  const rootElem = document.documentElement;
  rootElem.setAttribute("data-theme", theme);
  localStorage.setItem(themeStorageKey, theme);

  const myToggle = document.getElementById("myToggle");
  myToggle.checked = (theme === Theme.dark);
}, [theme]);

// FILTROS
var desaturationToggle = document.getElementById("myToggle3");
var contrastToggle = document.getElementById("contrastToggle");
var elementsToChange = document.querySelectorAll('.content, .sidebar, .filter-overlay, .logoimg, .menu-mobile');

function aplicarFiltros() {
  var storedDessaturationStatus = localStorage.getItem("Dessaturation");
  var storedInvContrastStatus = localStorage.getItem("InverseContrast");

  if (storedDessaturationStatus === "true") {
    elementsToChange.forEach(element => {
      element.style.filter = `grayscale(100%)`;
    });
    contrastToggle.checked = false;
  } else if (storedInvContrastStatus === "true") {
    elementsToChange.forEach(element => {
      element.style.filter = `invert(100%)`;
    });
    desaturationToggle.checked = false;
  } else {
    elementsToChange.forEach(element => {
      element.style.filter = `none`;
    });
  }
}

desaturationToggle.addEventListener("click", function () {
  localStorage.setItem("InverseContrast", "false")
  var isChecked = desaturationToggle.checked;

  if (isChecked) {
    elementsToChange.forEach(element => {
      element.style.filter = `grayscale(100%)`;
    });
    contrastToggle.checked = false;
  } else {
    elementsToChange.forEach(element => {
      element.style.filter = `none`;
    });
  }
  localStorage.setItem("Dessaturation", isChecked);
  aplicarFiltros();
});

var storedToggleStatus = localStorage.getItem("Dessaturation");

if (storedToggleStatus !== null) {
  desaturationToggle.checked = (storedToggleStatus === "true");
  aplicarFiltros();
}

contrastToggle.addEventListener("click", function () {
  localStorage.setItem("Dessaturation", "false")
  var isActive = contrastToggle.checked;

  if (isActive) {
    elementsToChange.forEach(element => {
      element.style.filter = `invert(100%)`;
    });
    desaturationToggle.checked = false;
  } else {
    elementsToChange.forEach(element => {
      element.style.filter = `none`;
    });
  }
  localStorage.setItem("InverseContrast", isActive);
  aplicarFiltros();
});

var storedInverseContrast = localStorage.getItem("InverseContrast");

if (storedInverseContrast !== null) {
  contrastToggle.checked = (storedInverseContrast === "true");
  aplicarFiltros();
}

//Fonte Dislexia
var fontToggle = document.getElementById("fontToggle");
function aplicarFonte() {
  var storedFontStatus = localStorage.getItem("fonte");

  if (storedFontStatus === "true") {
    document.body.classList.add('dislexia');
  } else {
    document.body.classList.remove('dislexia');
  }
}

fontToggle.addEventListener('click', function () {
  var Confirm = fontToggle.checked;
  
  if (Confirm) {
    document.body.classList.add('dislexia');
  } else {
    document.body.classList.remove('dislexia');
  }
  localStorage.setItem("fonte", Confirm);
  aplicarFonte();
})

//aumentar fonte
var fader = document.getElementById("fader");
var paragraphs = document.querySelectorAll("p");
var headings = document.querySelectorAll("h1");
var spans = document.querySelectorAll("span");
var initialFontSize = parseInt(window.getComputedStyle(paragraphs[0]).fontSize);
var resetButton = document.getElementById('resetButton')

fader.addEventListener("input", function () {
  var rangeValue = parseInt(this.value);
  var newFontSize = initialFontSize + rangeValue + "px";

  for (var i = 0; i < paragraphs.length; i++) {
    paragraphs[i].style.fontSize = newFontSize;
  }

  for (var j = 0; j < headings.length; j++) {
    if (!headings[j].classList.contains("page-title")) {
      headings[j].style.fontSize = newFontSize;
    }
  }

  for (var s = 0; s < spans.length; s++) {
    spans[s].style.fontSize = newFontSize;
  }

  if (rangeValue !== 0) {
    resetButton.style.display = "block";
  } else {
    for (var i = 0; i < paragraphs.length; i++) {
      paragraphs[i].style.fontSize = "";
    }
  
    for (var j = 0; j < headings.length; j++) {
      if (!headings[j].classList.contains("page-title")) {
        headings[j].style.fontSize = "";
      }
    }
  
    for (var s = 0; s < spans.length; s++) {
      spans[s].style.fontSize = "";
    }
    resetButton.style.display = "none";
  }
});

resetButton.addEventListener("click", function () {
  for (var i = 0; i < paragraphs.length; i++) {
    paragraphs[i].style.fontSize = "";
  }

  for (var j = 0; j < headings.length; j++) {
    headings[j].style.fontSize = "";
  }

  for (var s = 0; s < spans.length; s++) {
    spans[s].style.fontSize = "";
  }

  fader.value = 0;
  resetButton.style.display = "none";
});