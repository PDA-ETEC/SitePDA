function ekUpload() {
  function Init() {

    var savedImage = localStorage.getItem('profileImage');
  if (!savedImage) {
    var removeImageButton = document.getElementById('remove-image');
    removeImageButton.disabled = true;
  }

    var cancelButton = document.getElementById('cancel-button');
    cancelButton.addEventListener('click', cancelUpload);
    
    var changeImageButton = document.getElementById('change-image-button');
    changeImageButton.addEventListener('click', changeImage);
    
    var currentFile = null;
    
    var saveButton = document.getElementById('save-button');
    saveButton.addEventListener('click', saveImage);
    
    function saveImage() {
      if (currentFile) {
        // Ler o arquivo usando FileReader
        var reader = new FileReader();
        reader.onload = function (event) {
          var base64Image = event.target.result;
          
          // Salvar a imagem no Local Storage
          localStorage.setItem('profileImage', base64Image);
          
          // Exibir mensagem de sucesso
          alert('Imagem de perfil salva com sucesso');
          window.location.reload();
        }
      }
      //resetar o forms de upload
      document.getElementById('file-image-div').classList.add("hidden");
      document.getElementById('file-image').classList.add("hidden");
      document.getElementById('notimage').classList.remove("hidden");
      document.getElementById('start').classList.remove("hidden");
      document.getElementById('response').classList.add("hidden");
      document.getElementById("file-upload-form").reset();
      
      reader.readAsDataURL(currentFile);
    }

    var savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      var imageElement = document.getElementById('file-image');
      document.getElementById('file-image-div').classList.add("hidden");
      imageElement.src = savedImage;

      //ver a imagem dentro do localstorage
      var imageReviewElement = document.getElementById('userimgg');
      var icon = document.getElementById('placeholdericon')

      icon.classList.add("hidden2");
      imageReviewElement.classList.remove("hidden2");
      
      imageReviewElement.style.backgroundImage = 'url(' + savedImage + ')';
      
      var ImageReviewIcon = document.getElementById('icon')
      ImageReviewIcon.style.display = 'none'

      var imageReviewElement2 = document.getElementById('userimg')
      var icon2 = document.getElementById('placeholdericon2')

      icon2.classList.add('hidden2')
      imageReviewElement2.classList.remove('hidden2')

      imageReviewElement2.style.backgroundImage = 'url(' + savedImage + ')';

      var ImageReviewIcon2 = document.getElementById('icon')
      ImageReviewIcon2.style.display = 'none'
    } else {
      document.getElementById('userimgg').classList.add('hidden2')
    }
    
    function cancelUpload() {
      var xhr = new XMLHttpRequest();
      xhr.abort();
      
      // Ocultar a imagem
      document.getElementById('file-image-div').classList.add("hidden");
      document.getElementById('file-image').classList.add("hidden");
      document.getElementById('notimage').classList.remove("hidden");
      document.getElementById('start').classList.remove("hidden");
      document.getElementById('response').classList.add("hidden");
      document.getElementById("file-upload-form").reset();
    }

    function changeImage() {
      document.getElementById('file-upload').click();
    }

    var fileUpload = document.getElementById('file-upload');
    fileUpload.addEventListener('change', handleFileSelect, false);

    function handleFileSelect(e) {
      var files = e.target.files || e.dataTransfer.files;

      for (var i = 0, f; f = files[i]; i++) {
        parseFile(f);
        currentFile = f;
      }
    }

    var fileSelect = document.getElementById('file-upload');
    var fileDrag = document.getElementById('file-drag');

    fileSelect.addEventListener('change', fileSelectHandler, false);

    var xhr = new XMLHttpRequest();
    if (xhr.upload) {
      fileDrag.addEventListener('dragover', fileDragHover, false);
      fileDrag.addEventListener('dragleave', fileDragHover, false);
      fileDrag.addEventListener('drop', fileSelectHandler, false);
    }
  }

  function fileDragHover(e) {
    var fileDrag = document.getElementById('file-drag');

    e.stopPropagation();
    e.preventDefault();

    fileDrag.className = (e.type === 'dragover' ? 'hover' : 'modal-body file-upload');
  }

  function fileSelectHandler(e) {
    var files = e.target.files || e.dataTransfer.files;

    fileDragHover(e);

    for (var i = 0, f; f = files[i]; i++) {
      parseFile(f);
      uploadFile(f);
    }
  }

  function parseFile(file) {

    console.log(file.name);
    output('Deseja adicionar <strong>' + encodeURI(file.name) + '</strong> como sua foto de perfil? Salve as alterações');

    var imageName = file.name;
    var isGood = /\.(gif|jpg|png|jpeg)$/i.test(imageName);

    if (isGood) {
      document.getElementById('file-image-div').classList.remove("hidden");
      document.getElementById('start').classList.add("hidden");
      document.getElementById('response').classList.remove("hidden");
      document.getElementById('notimage').classList.add("hidden");
      document.getElementById('file-image').classList.remove("hidden");
      document.getElementById('file-image').src = URL.createObjectURL(file);
    } else {
      document.getElementById('file-image').classList.add("hidden");
      document.getElementById('notimage').classList.remove("hidden");
      document.getElementById('start').classList.remove("hidden");
      document.getElementById('response').classList.add("hidden");
      document.getElementById("file-upload-form").reset();
    }
  }

  // Output
  function output(msg) {
    var m = document.getElementById('messages');
    m.innerHTML = msg;
  }

  function uploadFile(file) {
    var xhr = new XMLHttpRequest();
    var fileInput = document.getElementById('class-roster-file');
    var fileSizeLimit = 1024; // In MB

    if (xhr.upload && file.size <= fileSizeLimit * 1024 * 1024) {
      xhr.open('POST', document.getElementById('file-upload-form').action, true);
      xhr.setRequestHeader('X-File-Name', file.name);
      xhr.setRequestHeader('X-File-Size', file.size);
      xhr.setRequestHeader('Content-Type', 'multipart/form-data');
      xhr.send(file);
    } else {
      output('Por favor, faça upload de um arquivo menor (< ' + fileSizeLimit + ' MB).');
    }
  }

  if (window.File && window.FileList && window.FileReader) {
    Init();
  } else {
    document.getElementById('file-drag').style.display = 'none';
  }

  function removeImage() {
    localStorage.removeItem('profileImage');
    window.location.reload();
  }

  var removeImageBtn = document.getElementById('remove-image');
  removeImageBtn.addEventListener('click', removeImage);
}
ekUpload();