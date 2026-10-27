
  function openCv() {
    document.getElementById('cvModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCv() {
    document.getElementById('cvModal').classList.remove('open');
    document.body.style.overflow = '';
  }
  function downloadCv() {
    var modal = document.querySelector('.cv-modal');
    var printWindow = window.open('', '_blank');
    var html = '<html><head><title>Kaixer Alvar CV</title>'
      + '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">'
      + '<style>body{font-family:"DM Sans",sans-serif;padding:1rem 1.5rem;color:#111;max-width:680px;margin:0 auto;font-size:11px;}.cv-name{font-size:18px;font-weight:700;}.cv-contact-line{font-size:11px;color:#666;}.cv-summary{font-size:11px;line-height:1.55;color:#444;}.cv-section-title{font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;}.cv-highlight{display:flex;gap:6px;margin-bottom:0.35rem;}.cv-highlight-dot{width:4px;height:4px;border-radius:50%;background:#000;flex-shrink:0;margin-top:5px;}.cv-highlight-text{font-size:11px;color:#333;line-height:1.45;}.cv-highlight-text strong{color:#000;font-weight:600;}.cv-edu-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;}.cv-edu-level{font-size:9px;font-weight:700;text-transform:uppercase;color:#999;}.cv-edu-school{font-size:12px;font-weight:600;color:#000;}.cv-edu-detail{font-size:10.5px;color:#555;}.cv-divider{border:none;border-top:1px solid #e5e5e5;margin:0.75rem 0;}button{display:none!important;}@page{margin:0.5in;}</style></head>'
      + '<body>' + modal.innerHTML + '</body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); printWindow.close(); }, 500);
  }
