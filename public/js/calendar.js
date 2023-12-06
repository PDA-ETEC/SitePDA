document.addEventListener("DOMContentLoaded", function () {
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");
    const currentMonthDisplay = document.getElementById("currentMonthDisplay");
    const calendarTable = document.querySelector("table");
    const selectedDateDisplay = document.getElementById("selectedDate");
    const selectedDateInput = document.getElementById("selectedDateInput");
    const showFormButton = document.getElementById("showForm");
    const appointmentForm = document.getElementById("appointmentForm");
    const mensagem = document.getElementById("mensagem");
    const noEvents = document.getElementById("noEvents")

    let currentDate = new Date();
    let currentSelectedCell = null;
    
    let currentDayMarked =
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();
    
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date()
        
        currentMonthDisplay.textContent = `${getMonthName(month)} de ${year}`;
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDay = firstDayOfMonth.getDay();
        const lastDate = lastDayOfMonth.getDate();
        
        const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        
        calendarTable.innerHTML = "";
        
        const headerRow = document.createElement("tr");
        for (const dayOfWeek of daysOfWeek) {
            const headerCell = document.createElement("th");
            headerCell.textContent = dayOfWeek;
            headerRow.appendChild(headerCell);
        }
        calendarTable.appendChild(headerRow);
        
        let date = 1;
        
        for (let i = 0; i < 6; i++) {
            const newRow = document.createElement("tr");
            
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement("td");
                const span = document.createElement("span");

                
                if (i === 0 && j < startDay) {
                    const prevMonthLastDate = new Date(year, month, 0).getDate();
                    cell.classList.add("other-month");
                    cell.addEventListener("click", goToPreviousMonth);
                    span.textContent = prevMonthLastDate - startDay + j + 1;
                } else if (date <= lastDate) {
                    cell.classList.add("current-month");
                    span.textContent = date;

                    if (
                        date === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear() &&
                        cell.classList.contains("current-month") // Verifica se está no mês atual
                     ) {
                        cell.classList.add("current-day");
                     }      
                    
                    // Adicione um ouvinte de evento de clique para cada célula
                    cell.addEventListener("click", (event) => {
                        const clickedCell = event.currentTarget;
                        
                        if (currentSelectedCell) {
                            currentSelectedCell.style.backgroundColor = '';
                            currentSelectedCell.style.color = '';
                        }
                        
                        clickedCell.style.backgroundColor = 'var(--sec-bg)';
                        clickedCell.style.color = '#fff';
                        currentSelectedCell = clickedCell;
                        
                        const clickedDate = new Date(year, month, clickedCell.textContent);
                        const formattedDate = `${String(clickedDate.getDate()).padStart(2, '0')}/${String(clickedDate.getMonth() + 1).padStart(2, '0')}/${clickedDate.getFullYear()}`;
                        selectedDateDisplay.textContent = `Data selecionada: ${formattedDate}`;
                        selectedDateInput.value = formattedDate;
                        mensagem.style.display = 'none';
                    });
                    
                    date++;
                } else {
                    cell.classList.add("other-month");
                    cell.addEventListener("click", goToNextMonth);
                    span.textContent = date - lastDate;
                    date++;
                }
                
                cell.appendChild(span);
                newRow.appendChild(cell);
            }
            
            calendarTable.appendChild(newRow);
        }      
            opacity();
        }
        
    function opacity() {
        var cells = calendarTable.querySelectorAll('.current-month');
        cells.forEach(function (cell) {
            cell.classList.add('editable');
            cell.addEventListener('mouseenter', onMouseEnter);
            cell.addEventListener('mouseleave', onMouseLeave);
        });
    }
    
    function onMouseEnter() {
        this.style.opacity = 0.8;
    }
    
    function onMouseLeave() {
        this.style.opacity = 1;
    }
    
    function getMonthName(month) {
        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril",
            "Maio", "Junho", "Julho", "Agosto",
            "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        return monthNames[month];
    }
    
    function goToPreviousMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        currentDayMarked =
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear();
        renderCalendar();
    }
    
    function goToNextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDayMarked =
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear();
        renderCalendar();
    }

    const categoriaSelect = document.getElementById("categoria");
    const conteudoInput = document.getElementById("conteudo");
    const mensagemCategoria = document.getElementById("mensagemCat");
    const mensagemConteudo = document.getElementById("mensagemCont");
    
    categoriaSelect.addEventListener("change", function () {
        if (categoriaSelect.value === "Escolha:") {
            mensagemCategoria.style.display = "block";
        } else {
            mensagemCategoria.style.display = "none"
        }
    });
    
    conteudoInput.addEventListener("input", function () {
        if (conteudoInput.value.trim() === "") {
            mensagemConteudo.style.display = "block";
        } else {
            mensagemConteudo.style.display = "none";
        }
    });
    
    
    showFormButton.addEventListener("click", function () {
        if (currentSelectedCell) {
            if (appointmentForm.style.display === "none" || appointmentForm.style.display === "") {
                appointmentForm.style.display = "flex";
                showFormButton.style.display = "none";
            } else {
                appointmentForm.style.display = "none";
            }
        } else {
            mensagem.style.display = "block";
        }
    });
    
    prevMonthBtn.addEventListener("click", goToPreviousMonth);
    nextMonthBtn.addEventListener("click", goToNextMonth);
    
    renderCalendar();
});