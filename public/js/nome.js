document.addEventListener('DOMContentLoaded', function () {
    const typewriterText = "Bem-vindo ao PDA!";
    const typewriterElement = document.querySelector('.typewriter h2');
    let i = 0;

    function typeNextLetter() {
      typewriterElement.innerHTML += typewriterText.charAt(i);

      if (i < typewriterText.length - 1) {
        i++;
        setTimeout(typeNextLetter, 100);
      }
    }

    typeNextLetter();
  });