function CC() {
    var editMode = false;
    var btnEdit = document.getElementById('editTable');
    var table = document.getElementById('content');
    var selectedCell = null;
    var selectedBackgroundColor = "";
    var selectedTextColor = "";

    function changeMode() {
        editMode = !editMode;
        if (editMode) {
            editModeON();
            btnEdit.textContent = 'Sair do modo de edição';
        } else {
            editModeOFF();
            btnEdit.textContent = 'Alterar tabela';
        }
    }

    function editModeON() {
        var cells = table.querySelectorAll('td');
        cells.forEach(function(cell) {
            cell.classList.add('editable');
            cell.addEventListener('mouseenter', onMouseEnter);
            cell.addEventListener('mouseleave', onMouseLeave);
            cell.addEventListener('click', clickHandler);
        });
    }

    function editModeOFF() {
        var cells = table.querySelectorAll('td');
        cells.forEach(function(cell) {
            cell.classList.remove('editable');
            cell.removeEventListener('mouseenter', onMouseEnter);
            cell.removeEventListener('mouseleave', onMouseLeave);
            cell.removeEventListener('click', clickHandler);
        });

        selectedCell = null;
    }

    function onMouseEnter() {
        this.style.opacity = 0.8;
    }

    function onMouseLeave() {
        this.style.opacity = 1;
    }

    function clickHandler() {
        selectedCell = this;
        var contentInput = document.getElementById('contentInput')
        var colorPicker = document.getElementById('colorPicker');
        var textColorPicker = document.getElementById('textColorPicker');
        var colorModal = new bootstrap.Modal(document.getElementById('exampleModal'));
        var saveButton = document.getElementById('saveButton');

        if (selectedCell.style.backgroundColor) {
            colorPicker.value = selectedCell.style.backgroundColor;
            selectedBackgroundColor = selectedCell.style.backgroundColor;
        } else {
            colorPicker.value = '#ffffff';
            selectedBackgroundColor = "";
        }

        if (selectedCell.style.color) {
            textColorPicker.value = selectedCell.style.color;
            selectedTextColor = selectedCell.style.color;
        } else {
            textColorPicker.value = '#000000';
            selectedTextColor = "";
        }

        colorModal.show();

        saveButton.addEventListener('click', function() {
            if (selectedCell) {
                selectedCell.textContent = contentInput.value;
                selectedCell.style.backgroundColor = colorPicker.value;
                selectedCell.style.color = textColorPicker.value;
                saveTableState(); // Salva as informações no localStorage
                colorModal.hide();
            }
        });
    }

    function saveTableState() {
        var tableState = {};
        var cells = table.querySelectorAll('td');

        cells.forEach(function(cell, index) {
            var backgroundColor = cell.style.backgroundColor;
            var textColor = cell.style.color;
            var content = cell.textContent;
            if (backgroundColor || textColor || content) {
                tableState[index] = { backgroundColor: backgroundColor, textColor: textColor, content: content};
            }
        });

        localStorage.setItem('tableState', JSON.stringify(tableState));
    }

    btnEdit.addEventListener('click', changeMode);

    // Carrega o estado da tabela ao inicializar
    var savedTableState = localStorage.getItem('tableState');
    if (savedTableState) {
        var tableState = JSON.parse(savedTableState);
        var cells = table.querySelectorAll('td');

        cells.forEach(function(cell, index) {
            var cellState = tableState[index];
            if (cellState) {
                cell.style.backgroundColor = cellState.backgroundColor;
                cell.style.color = cellState.textColor;
                cell.textContent = cellState.content;
            }
        });
    }
}

CC();