/** Shared print layout for the report, checklist and pro forma. A4, embedded fonts. */
export async function pdfDocument(title: string, subtitle: string, fontFetch: typeof fetch = fetch, options: {compact?: boolean} = {}) {
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
  let pageContext = "";
  const continuations = new Map<number, string>();
  const newPage = () => {
    doc.addPage(); y = 32;
    if (pageContext) continuations.set(doc.getNumberOfPages(), pageContext);
  };
  const keep = (height: number) => { if (y + height > bottom) newPage(); };
  const leadingFor = (size: number) => options.compact ? size * .38 + .8 : size * .42 + 1.3;
  const paragraphGap = options.compact ? 1.7 : 2.5;
  const line = (text: string, size = 10, bold = false, indent = 0) => {
    doc.setFont("NotoSans", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(bold ? [19, 39, 73] : [55, 66, 84]) as [number, number, number]);
    const leading = leadingFor(size);
    const lines = doc.splitTextToSize(text, width - indent) as string[];
    // Keep short paragraphs and titles together. Longer paragraphs may span pages.
    keep(Math.min(lines.length, 3) * leading + 3);
    for (const l of lines) {
      if (y + leading > bottom) newPage();
      doc.text(l, left + indent, y);
      y += leading;
    }
    y += paragraphGap;
  };
  /** A checklist item: a drawn box (ticked when done) beside a bold title. */
  const check = (text: string, done: boolean, size = 11) => {
    const indent = 7, box = 4.2;
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(size);
    doc.setTextColor(19, 39, 73);
    const leading = leadingFor(size);
    const lines = doc.splitTextToSize(text, width - indent) as string[];
    keep(Math.min(lines.length, 3) * leading + 3);
    const top = y - box + 0.6;
    doc.setLineWidth(0.4);
    if (done) {
      doc.setFillColor(48, 80, 224);
      doc.setDrawColor(48, 80, 224);
      doc.roundedRect(left, top, box, box, 0.7, 0.7, "FD");
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.6);
      doc.line(left + 1, top + 2.2, left + 1.8, top + 3.1);
      doc.line(left + 1.8, top + 3.1, left + 3.3, top + 1.1);
    } else {
      doc.setDrawColor(125, 140, 165);
      doc.roundedRect(left, top, box, box, 0.7, 0.7, "D");
    }
    for (const l of lines) {
      if (y + leading > bottom) newPage();
      doc.text(l, left + indent, y);
      y += leading;
    }
    y += paragraphGap;
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
  const link = (label: string, url: string, indent = 0) => {
    doc.setFont('NotoSans', 'normal'); doc.setFontSize(9); doc.setTextColor(39, 71, 201);
    const lines = doc.splitTextToSize(label, width - indent) as string[];
    keep(lines.length * 5.5 + 3);
    for (const text of lines) { doc.textWithLink(text, left + indent, y, {url}); y += 5.5; }
    y += 3;
  };
  line(title, 24, true);
  line(subtitle, 10);
  y += 3;
  return {
    doc, line, section, link, keep, check,
    setPageContext: (label: string) => { pageContext = label; },
    textHeight: (text: string, size = 10, bold = false, indent = 0) => {
      doc.setFont("NotoSans", bold ? "bold" : "normal");
      doc.setFontSize(size);
      return (doc.splitTextToSize(text, width - indent) as string[]).length * leadingFor(size) + paragraphGap;
    },
    cashChart: (values: number[], reserve: number) => {
      keep(59);
      const min = Math.min(0, ...values), max = Math.max(reserve, 0, ...values);
      const range = max - min || 1;
      const x = (i: number) => left + 31 + i / Math.max(1, values.length - 1) * 139;
      const cy = (v: number) => y + 39 - (v - min) / range * 35;
      const dollars = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
      doc.setFont("NotoSans", "normal"); doc.setFontSize(8); doc.setTextColor(55, 66, 84);
      doc.text(dollars(max), left, y + 6);
      doc.text(dollars(min), left, y + 39);
      doc.setDrawColor(160, 174, 193); doc.setLineWidth(.3);
      doc.line(x(0), cy(0), x(values.length - 1), cy(0));
      if (reserve > 0) {
        doc.setDrawColor(132, 94, 30); doc.setLineDashPattern([2, 1], 0);
        doc.line(x(0), cy(reserve), x(values.length - 1), cy(reserve));
        doc.setLineDashPattern([], 0);
      }
      doc.setDrawColor(39, 71, 201); doc.setLineWidth(.7);
      for (let i = 1; i < values.length; i++) doc.line(x(i - 1), cy(values[i - 1]), x(i), cy(values[i]));
      doc.text("Opening", x(0), y + 45);
      doc.text("Month 12", x(12), y + 45, {align: "center"});
      doc.text("Month 24", x(values.length - 1), y + 45, {align: "right"});
      doc.text(reserve > 0 ? "Blue: projected cash  |  Dashed: chosen reserve" : "Blue: projected cash  |  Gray: zero cash", left, y + 53);
      y += 60;
    },
    table: (headers: string[], rows: string[][], widths: number[], settings: {compact?: boolean; numeric?: number[]} = {}) => {
      const fontSize = settings.compact ? 9 : 8;
      const rowLeading = settings.compact ? 4 : 4.3;
      const rowPadding = settings.compact ? 2.5 : 4;
      const row = (values: string[], index: number) => {
        doc.setFont('NotoSans', index < 0 ? 'bold' : 'normal'); doc.setFontSize(fontSize);
        const cells = values.map((v, i) => doc.splitTextToSize(v, widths[i] - 4) as string[]);
        const height = Math.max(...cells.map(c => c.length)) * rowLeading + rowPadding;
        if (y + height > bottom) { newPage(); if (index >= 0) row(headers, -1); }
        doc.setFillColor(...(index < 0 ? [19,39,73] : index % 2 === 0 ? [241,245,250] : [255,255,255]) as [number,number,number]);
        doc.rect(left, y - 4, width, height, 'F');
        // A repeated header may have changed the font.
        doc.setFont('NotoSans', index < 0 ? 'bold' : 'normal'); doc.setFontSize(fontSize);
        doc.setTextColor(...(index < 0 ? [255,255,255] : [55,66,84]) as [number,number,number]);
        let x = left;
        cells.forEach((cell, i) => {
          const right = settings.numeric?.includes(i);
          cell.forEach((text, j) => doc.text(text, right ? x + widths[i] - 2 : x + 2, y + j * rowLeading, {align: right ? "right" : "left"}));
          x += widths[i];
        });
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
        const context = continuations.get(i);
        if (context) doc.text(context, 191, 27, {align: "right"});
        doc.text('practicestartupservices.com', left, 288);
        doc.text(`${i} / ${pages}`, 191, 288, {align:'right'});
      }
      if (filename) doc.save(filename);
      return doc.output('arraybuffer');
    },
  };
}
