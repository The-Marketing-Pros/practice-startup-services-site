/** Shared print layout for the report, checklist and pro forma. A4, embedded fonts. */
export async function pdfDocument(title: string, subtitle: string, fontFetch: typeof fetch = fetch) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  for (const weight of ["Regular", "Bold"]) {
    const response = await fontFetch(`/fonts/NotoSans-${weight}.ttf`);
    if (!response.ok) throw new Error("The PDF font could not be loaded.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    doc.addFileToVFS(`NotoSans-${weight}.ttf`, btoa(binary));
    doc.addFont(`NotoSans-${weight}.ttf`, "NotoSans", weight === "Bold" ? "bold" : "normal");
  }
  doc.setProperties({title, subject: subtitle, author: 'Physician Practice Specialists', creator: 'Practice Startup Services'});
  const left = 19, width = 172, bottom = 274;
  let y = 32;
  const anchors = new Map<string, {pageNumber: number; top: number}>();
  const jumps: {id: string; page: number; y: number; height: number}[] = [];
  const newPage = () => { doc.addPage(); y = 32; };
  const keep = (height: number) => { if (y + height > bottom) newPage(); };
  const line = (text: string, size = 10, bold = false) => {
    doc.setFont("NotoSans", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(bold ? [19, 39, 73] : [55, 66, 84]) as [number, number, number]);
    const leading = size * 0.42 + 1.3;
    const lines = doc.splitTextToSize(text, width) as string[];
    // Keep short paragraphs and titles together. Longer paragraphs may span pages.
    keep(Math.min(lines.length, 3) * leading + 3);
    for (const l of lines) {
      if (y + leading > bottom) newPage();
      doc.text(l, left, y);
      y += leading;
    }
    y += 2.5;
  };
  const section = (text: string, id?: string, fresh = false) => {
    if (fresh && y > 33) newPage();
    keep(35);
    if (id) anchors.set(id, {pageNumber: doc.getNumberOfPages(), top: y - 5});
    doc.setFillColor(235, 241, 251);
    doc.roundedRect(left, y - 5, width, 13, 2, 2, 'F');
    doc.setFillColor(48, 80, 224);
    doc.rect(left, y - 5, 1.5, 13, 'F');
    doc.setFont('NotoSans', 'bold'); doc.setFontSize(13); doc.setTextColor(19, 39, 73);
    doc.text(text, left + 5, y + 3);
    y += 18;
  };
  const link = (label: string, url: string) => {
    doc.setFont('NotoSans', 'normal'); doc.setFontSize(9); doc.setTextColor(39, 71, 201);
    const lines = doc.splitTextToSize(label, width) as string[];
    keep(lines.length * 5.5 + 3);
    for (const text of lines) { doc.textWithLink(text, left, y, {url}); y += 5.5; }
    y += 3;
  };
  line(title, 24, true);
  line(subtitle, 10);
  y += 3;
  return {
    doc, line, section, link, keep,
    table: (headers: string[], rows: string[][], widths: number[]) => {
      const row = (values: string[], index: number) => {
        doc.setFont('NotoSans', index < 0 ? 'bold' : 'normal'); doc.setFontSize(8);
        const cells = values.map((v, i) => doc.splitTextToSize(v, widths[i] - 4) as string[]);
        const height = Math.max(...cells.map(c => c.length)) * 4.3 + 4;
        if (y + height > bottom) { newPage(); if (index >= 0) row(headers, -1); }
        doc.setFillColor(...(index < 0 ? [19,39,73] : index % 2 === 0 ? [241,245,250] : [255,255,255]) as [number,number,number]);
        doc.rect(left, y - 4, width, height, 'F');
        // A repeated header may have changed the font.
        doc.setFont('NotoSans', index < 0 ? 'bold' : 'normal'); doc.setFontSize(8);
        doc.setTextColor(...(index < 0 ? [255,255,255] : [55,66,84]) as [number,number,number]);
        let x = left;
        cells.forEach((cell, i) => { cell.forEach((text, j) => doc.text(text, x + 2, y + j * 4.3)); x += widths[i]; });
        y += height;
      };
      keep(25); row(headers, -1); rows.forEach((values, i) => row(values, i)); y += 6;
    },
    jump: (label: string, id: string) => {
      keep(10);
      doc.setFont('NotoSans', 'normal'); doc.setFontSize(10); doc.setTextColor(39, 71, 201);
      doc.text(label, left, y);
      jumps.push({id, page: doc.getNumberOfPages(), y: y - 4, height: 7});
      y += 9;
    },
    space: () => { y += 5; },
    finish: (filename?: string) => {
      const pages = doc.getNumberOfPages();
      for (const jump of jumps) {
        const target = anchors.get(jump.id);
        if (!target) throw new Error(`Missing PDF section: ${jump.id}`);
        doc.setPage(jump.page);
        doc.link(left, jump.y, width, jump.height, target);
      }
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont('NotoSans', 'bold'); doc.setFontSize(8); doc.setTextColor(19, 39, 73);
        doc.text('PRACTICE STARTUP SERVICES', left, 15);
        doc.setFont('NotoSans', 'normal'); doc.setFontSize(8); doc.setTextColor(94, 109, 132);
        doc.text('BY PHYSICIAN PRACTICE SPECIALISTS', 191, 15, {align:'right'});
        doc.setDrawColor(217, 225, 238); doc.setLineWidth(.3);
        doc.line(left, 21, 191, 21); doc.line(left, 281, 191, 281);
        doc.text('practicestartupservices.com', left, 288);
        doc.text(`${i} / ${pages}`, 191, 288, {align:'right'});
      }
      if (filename) doc.save(filename);
      return doc.output('arraybuffer');
    },
  };
}
