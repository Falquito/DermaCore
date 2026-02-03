// src/lib/pdf/pacienteHistorialPdf.ts
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import type { Paciente, Consultas, ObraSocial, Coseguro } from "@prisma/client";

export type ConsultaConRelaciones = Consultas & {
  obraSocial?: ObraSocial | null;
  coseguro?: Coseguro | null;
};

const CYAN_COLOR = "#06B6D4";
const CYAN_LIGHT = "#E0F2FE";

function formatFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function writeTableRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string | null,
  startX: number = 70
) {
  const labelWidth = 150;
  const valueX = startX + labelWidth;

  doc.font("Helvetica-Bold").fontSize(10).text(label, startX, doc.y, {
    width: labelWidth - 10,
  });

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(value ?? "No se rellenó este apartado", valueX, doc.y - 10, {
      width: 350,
    });

  doc.moveDown(1.2);
}

function writeSection(
  doc: PDFKit.PDFDocument,
  title: string,
  value?: string | null,
  options?: { showIfNull?: boolean }
) {
  if (!value && !options?.showIfNull) return;

  doc.font("Helvetica-Bold").fontSize(10).fillColor(CYAN_COLOR).text(`${title}:`);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#000000")
    .text(value ?? "No se rellenó este apartado")
    .moveDown(0.5);
}

export function generatePacienteHistorialPdf(params: {
  paciente: Paciente;
  consultas: ConsultaConRelaciones[];
  logoBuffer?: Buffer;
}) {
  const { paciente, consultas, logoBuffer } = params;

  const doc = new PDFDocument({ margin: 40, size: "A4" });

  // ---- Header Superior ----
  // Información izquierda
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor(CYAN_COLOR)
    .text("Dra. Aban Vilma", 50, 30);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#000000")
    .text("Centro Dermatológico", 50, 48);

  const today = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#666666")
    .text(`${today}`, 50, 63);

  // Logo y nombre derecha
  if (logoBuffer) {
    try {
      const dataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      doc.image(dataUrl, 420, 30, { width: 45, height: 30 });
    } catch (error) {
      console.error("Error al cargar el logo en header:", error);
    }
  }

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(CYAN_COLOR)
    .text("DermaCore", 470, 40, { width: 80, align: "left" });

  // Línea separadora
  doc
    .moveTo(50, 80)
    .lineTo(550, 80)
    .stroke(CYAN_LIGHT);

  doc.y = 95;

  // ---- Header Título ----
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor(CYAN_COLOR)
    .text("HISTORIA CLINICA DEL PACIENTE", 50, doc.y, { width: 495, align: "center" })
    .moveDown(0.8);

  // ---- Paciente Info Box ----
  const boxX = 50;
  const boxY = doc.y;
  const boxWidth = 495;

  // Encabezado cyan
  doc
    .rect(boxX, boxY, boxWidth, 25)
    .fillAndStroke(CYAN_COLOR, CYAN_COLOR);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#FFFFFF")
    .text("INFORMACIÓN DEL PACIENTE", boxX + 15, boxY + 5);

  // Contenido blanco
  let contentY = boxY + 25;

  const labelWidth = 100;
  const valueX = boxX + labelWidth + 15;
  const col1X = boxX + 15;
  const col2X = boxX + 260;

  // Fila 1: Nombre
  doc
    .rect(boxX, contentY, boxWidth, 25)
    .stroke(CYAN_COLOR);

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(CYAN_COLOR)
    .text("Nombre:", col1X, contentY + 5);

  doc
    .font("Helvetica")
    .fillColor("#000000")
    .text(`${paciente.apellidoPaciente}, ${paciente.nombrePaciente}`, valueX, contentY + 5);

  // Fila 2: DNI
  contentY += 25;
  doc
    .rect(boxX, contentY, boxWidth, 25)
    .stroke(CYAN_COLOR);

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(CYAN_COLOR)
    .text("DNI:", col1X, contentY + 5);

  doc
    .font("Helvetica")
    .fillColor("#000000")
    .text(`${paciente.dniPaciente}`, valueX, contentY + 5);

  // Fila 3: Teléfono y Domicilio
  contentY += 25;
  doc
    .rect(boxX, contentY, boxWidth, 25)
    .stroke(CYAN_COLOR);

  if (paciente.telefonoPaciente) {
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(CYAN_COLOR)
      .text("Teléfono:", col1X, contentY + 5);

    doc
      .font("Helvetica")
      .fillColor("#000000")
      .text(`${paciente.telefonoPaciente}`, valueX, contentY + 5);
  }

  if (paciente.domicilioPaciente) {
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(CYAN_COLOR)
      .text("Domicilio:", col2X, contentY + 5);

    doc
      .font("Helvetica")
      .fillColor("#000000")
      .text(`${paciente.domicilioPaciente}`, col2X + 80, contentY + 5);
  }

  // Fila 4: Fecha de alta
  contentY += 25;
  doc
    .rect(boxX, contentY, boxWidth, 25)
    .stroke(CYAN_COLOR);

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(CYAN_COLOR)
    .text("Fecha de alta:", col1X, contentY + 5);

  doc
    .font("Helvetica")
    .fillColor("#000000")
    .text(`${formatFecha(paciente.fechaHoraPaciente)}`, valueX, contentY + 5);

  doc.y = contentY + 30;

  // ---- Resumen ----
  doc.moveDown(0.6);
  
  if (consultas.length > 0) {
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(CYAN_COLOR)
      .text("Resumen de Consultas", 40)
      .moveDown(0.3);

    doc.fontSize(9).font("Helvetica").fillColor("#000000");
    doc.text(`Total de consultas: ${consultas.length}`);
    doc.text(`Primera consulta: ${formatFecha(consultas[0].fechaHoraConsulta)}`);
    doc.text(
      `Última consulta: ${formatFecha(
        consultas[consultas.length - 1].fechaHoraConsulta
      )}`
    );
  } else {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text("El paciente no registra consultas.");
  }

  doc.moveDown(0.6);

  // ---- Detalle de consultas ----
  consultas.forEach((consulta, index) => {
    // Si no hay suficiente espacio en la página actual para una nueva consulta,
    // no forzar nueva página automáticamente - dejar que pdfkit lo haga naturalmente
    const consultaBoxX = 40;
    const consultaBoxY = doc.y;
    const consultaBoxWidth = 515;

    // Encabezado de consulta con fondo cyan
    doc
      .rect(consultaBoxX, consultaBoxY, consultaBoxWidth, 28)
      .fillAndStroke(CYAN_COLOR, CYAN_COLOR);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text(`Consulta del ${formatFecha(consulta.fechaHoraConsulta)}`, consultaBoxX + 12, consultaBoxY + 6);

    doc.y = consultaBoxY + 32;

    // Tabla con información de la consulta
    doc.fontSize(9).fillColor("#000000");

    writeTableRow(doc, "Tipo de consulta:", consulta.tipoConsulta);

    if (consulta.obraSocial) {
      writeTableRow(doc, "Obra social:", consulta.obraSocial.nombreObraSocial);
      if (consulta.nroAfiliado) {
        writeTableRow(doc, "N° Afiliado:", consulta.nroAfiliado);
      }
    }

    if (consulta.coseguro) {
      writeTableRow(doc, "Coseguro:", consulta.coseguro.nombreCoseguro);
    }

    if (consulta.montoConsulta) {
      writeTableRow(doc, "Monto:", `$${consulta.montoConsulta}`);
    }

    doc.moveDown(0.3);

    // Secciones de notas clínicas
    writeSection(doc, "Motivo de consulta", consulta.motivoConsulta);
    writeSection(doc, "Diagnóstico", consulta.diagnosticoConsulta, {
      showIfNull: true,
    });
    writeSection(doc, "Tratamiento", consulta.tratamientoConsulta, {
      showIfNull: true,
    });
    writeSection(
      doc,
      "Estudios complementarios",
      consulta.estudiosComplementarios
    );

    doc.moveDown(0.5);
    doc
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .stroke(CYAN_LIGHT);
    doc.moveDown(0.3);
  });

  return doc;}