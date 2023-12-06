function gerarPDF() {
    // Cria um novo documento PDF com o tamanho desejado
    var doc = new jsPDF("p", "mm", "a4");
    
    // Insere o HTML da página atual no documento PDF
    doc.html(document.body);
    
    // Salva o documento PDF com o nome desejado
    doc.save("meu-pdf.pdf");
    }