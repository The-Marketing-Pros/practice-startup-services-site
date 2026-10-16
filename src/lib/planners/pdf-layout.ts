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
  let y = 20;
  const line = (text: string, size = 10, bold = false) => {
    doc.setFont("NotoSans", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, 172) as string[];
    for (const l of lines) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(l, 19, y);
      y += size * 0.43 + 2;
    }
    y += 2;
  };
  line(title, 20, true);
  line(subtitle, 11);
  return {
    doc,
    line,
    link: (label: string, url: string) => {
      doc.setFont("NotoSans", "normal");
      doc.setFontSize(9);
      doc.setTextColor(35, 79, 70);
      for (const text of doc.splitTextToSize(`${label}: ${url}`, 172) as string[]) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.textWithLink(text, 19, y, { url });
        y += 6;
      }
      y += 2;
      doc.setTextColor(0);
    },
    keep: (height: number) => { if (y + height > 275) { doc.addPage(); y = 20; } },
    space: () => {
      y += 5;
    },
    finish: (filename?: string) => {
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(90);
        doc.text(
          `Physician Practice Specialists | practicestartupservices.com | ${i} / ${pages}`,
          19,
          288,
        );
      }
      if (filename) doc.save(filename);
      return doc.output("arraybuffer");
    },
  };
}
